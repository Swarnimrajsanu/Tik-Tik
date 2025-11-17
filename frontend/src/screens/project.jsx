import Markdown from 'markdown-to-jsx'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import CodePlayground from '../components/CodePlayground.jsx'
import axios from '../config/axios.js'
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket.js'
import { getWebContainer } from '../config/webContainer.js'
import { UserContext } from '../context/user.context.jsx'

function SyntaxHighlightedCode(props) {
    const ref = useRef(null)

    React.useEffect(() => {
        if (ref.current && props.className?.includes('lang-') && window.hljs) {
            window.hljs.highlightElement(ref.current)
            ref.current.removeAttribute('data-highlighted')
        }
    }, [props.className, props.children])

    return <code {...props} ref={ref} />
}

function JSONFormatter({ jsonString }) {
    try {
        const parsed = JSON.parse(jsonString)
        const formatted = JSON.stringify(parsed, null, 2)
        
        return (
            <pre className="json-formatter bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <code 
                    className="language-json text-sm"
                    dangerouslySetInnerHTML={{
                        __html: window.hljs ? window.hljs.highlight(formatted, { language: 'json' }).value : formatted
                    }}
                />
            </pre>
        )
    } catch (e) {
        return <pre className="text-red-400 text-sm">{jsonString}</pre>
    }
}

function HighlightedText({ text, children }) {
    const textContent = typeof text === 'string' ? text : 
                       (typeof children === 'string' ? children : 
                       (Array.isArray(children) ? children.join('') : 
                       (children ? String(children) : '')))

    if (!textContent) return <>{children}</>

    const keywordPatterns = [
        { pattern: /\b(function|const|let|var|if|else|for|while|return|async|await|import|export|class|extends|super|this|new|try|catch|finally|throw|Promise)\b/g, color: '#c678dd', className: 'keyword' },
        { pattern: /\b(true|false|null|undefined)\b/g, color: '#e06c75', className: 'literal' },
        { pattern: /\b\d+\.?\d*\b/g, color: '#d19a66', className: 'number' },
        { pattern: /"[^"]*":/g, color: '#61afef', className: 'json-key' },
        { pattern: /:\s*"[^"]*"/g, color: '#98c379', className: 'json-string' },
        { pattern: /\b(fileTree|file|contents|directory|name|type|path|extension)\b/g, color: '#56b6c2', className: 'property' },
        { pattern: /\b(React|Component|useState|useEffect|props|state)\b/g, color: '#61afef', className: 'react-keyword' },
    ]

    const parts = []
    let lastIndex = 0
    const matches = []

    keywordPatterns.forEach(({ pattern, color, className }) => {
        let match
        pattern.lastIndex = 0
        while ((match = pattern.exec(textContent)) !== null) {
            matches.push({
                start: match.index,
                end: match.index + match[0].length,
                text: match[0],
                color,
                className
            })
        }
    })

    matches.sort((a, b) => a.start - b.start)

    const nonOverlapping = []
    matches.forEach(match => {
        if (nonOverlapping.length === 0 || match.start >= nonOverlapping[nonOverlapping.length - 1].end) {
            nonOverlapping.push(match)
        }
    })

    nonOverlapping.forEach(match => {
        if (match.start > lastIndex) {
            parts.push({ text: textContent.substring(lastIndex, match.start), isHighlight: false })
        }
        parts.push({ text: match.text, isHighlight: true, color: match.color, className: match.className })
        lastIndex = match.end
    })

    if (lastIndex < textContent.length) {
        parts.push({ text: textContent.substring(lastIndex), isHighlight: false })
    }

    return (
        <span>
            {parts.map((part, index) => 
                part.isHighlight ? (
                    <span 
                        key={index} 
                        style={{ color: part.color, fontWeight: '600' }}
                        className={`highlight-${part.className}`}
                    >
                        {part.text}
                    </span>
                ) : (
                    <span key={index}>{part.text}</span>
                )
            )}
        </span>
    )
}

const Project = () => {
    const location = useLocation()
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState(new Set())
    const [project, setProject] = useState(location.state?.project || null)
    const [message, setMessage] = useState('')
    const [users, setUsers] = useState([])
    const [messages, setMessages] = useState([])
    const [fileTree, setFileTree] = useState({})
    const { user } = useContext(UserContext)
    const messageBox = useRef(null)

    const handleUserClick = (id) => {
        setSelectedUserId(prev => {
            const newSet = new Set(prev)
            if (newSet.has(id)) {
                newSet.delete(id)
            } else {
                newSet.add(id)
            }
            return newSet
        })
    }

    const addCollaborators = () => {
        if (!project?._id) return

        axios.put("/projects/add-user", {
            projectId: project._id,
            users: Array.from(selectedUserId)
        }).then(() => {
            setIsModalOpen(false)
            setSelectedUserId(new Set())
            axios.get(`/projects/get-project/${project._id}`)
                .then(res => setProject(res.data.project))
                .catch(() => {})
        }).catch(() => {})
    }

    const send = () => {
        sendMessage('project-message', {
            message,
            sender: user
        })
        setMessages(prev => [...prev, { sender: user, message }])
        setMessage("")
    }

    const WriteAiMessage = (message) => {
        try {
            let messageObject
            let isJSON = false
            
            if (typeof message === 'string') {
                try {
                    messageObject = JSON.parse(message)
                    isJSON = true
                } catch {
                    messageObject = { text: message }
                }
            } else {
                messageObject = message
                isJSON = true
            }

            let textContent = ''
            if (typeof messageObject === 'string') {
                textContent = messageObject
            } else if (messageObject?.text) {
                textContent = messageObject.text
            } else if (typeof messageObject === 'object') {
                textContent = JSON.stringify(messageObject, null, 2)
                isJSON = true
            } else {
                textContent = String(messageObject || '')
            }

            if (typeof textContent !== 'string') {
                textContent = String(textContent)
            }

            if (!isJSON) {
                try {
                    JSON.parse(textContent)
                    isJSON = true
                } catch {
                    isJSON = false
                }
            }

            if (isJSON && (textContent.trim().startsWith('{') || textContent.trim().startsWith('['))) {
                return (
                    <div className='overflow-auto rounded-lg p-0'>
                        <JSONFormatter jsonString={textContent} />
                    </div>
                )
            }

            return (
                <div className='overflow-auto bg-gradient-to-br from-gray-50 to-white text-gray-900 rounded-lg p-4 border border-gray-200 shadow-sm'>
                    <div className="prose prose-sm max-w-none">
                        <Markdown
                            children={textContent}
                            options={{
                                overrides: {
                                    code: {
                                        component: SyntaxHighlightedCode,
                                        props: {
                                            className: 'language-javascript bg-gray-900 text-gray-100 px-2 py-1 rounded text-xs font-mono',
                                        }
                                    },
                                    pre: {
                                        component: 'pre',
                                        props: {
                                            className: 'bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-3 shadow-lg border border-gray-700',
                                        }
                                    },
                                    p: {
                                        component: ({ children, ...props }) => {
                                            const text = Array.isArray(children) ? children.join('') : String(children || '')
                                            return (
                                                <p {...props} className="mb-3 text-gray-800 leading-relaxed">
                                                    <HighlightedText text={text} />
                                                </p>
                                            )
                                        }
                                    },
                                    h1: {
                                        component: 'h1',
                                        props: {
                                            className: 'text-2xl font-bold mb-3 text-indigo-700 border-b-2 border-indigo-200 pb-2',
                                        }
                                    },
                                    h2: {
                                        component: 'h2',
                                        props: {
                                            className: 'text-xl font-bold mb-2 text-blue-700 mt-4',
                                        }
                                    },
                                    h3: {
                                        component: 'h3',
                                        props: {
                                            className: 'text-lg font-bold mb-2 text-purple-700 mt-3',
                                        }
                                    },
                                    ul: {
                                        component: 'ul',
                                        props: {
                                            className: 'list-disc list-inside mb-3 text-gray-800 space-y-1 ml-4',
                                        }
                                    },
                                    ol: {
                                        component: 'ol',
                                        props: {
                                            className: 'list-decimal list-inside mb-3 text-gray-800 space-y-1 ml-4',
                                        }
                                    },
                                    li: {
                                        component: ({ children, ...props }) => {
                                            const text = Array.isArray(children) ? children.join('') : String(children || '')
                                            return (
                                                <li {...props} className="mb-1 text-gray-800">
                                                    <HighlightedText text={text} />
                                                </li>
                                            )
                                        }
                                    },
                                    strong: {
                                        component: 'strong',
                                        props: {
                                            className: 'font-bold text-indigo-700',
                                        }
                                    },
                                    em: {
                                        component: 'em',
                                        props: {
                                            className: 'italic text-purple-600',
                                        }
                                    },
                                    blockquote: {
                                        component: 'blockquote',
                                        props: {
                                            className: 'border-l-4 border-blue-500 pl-4 italic text-gray-700 my-3 bg-blue-50 py-2 rounded-r',
                                        }
                                    }
                                },
                            }}
                        />
                    </div>
                </div>
            )
        } catch (error) {
            return (
                <div className='overflow-auto bg-red-50 text-red-900 rounded-lg p-4 border-2 border-red-300 shadow-sm'>
                    <p className="font-mono text-sm">
                        {typeof message === 'string' ? message : JSON.stringify(message, null, 2)}
                    </p>
                </div>
            )
        }
    }

    useEffect(() => {
        if (!project?._id) return

        initializeSocket(project._id)

        getWebContainer().then(container => {
            container.mount(fileTree)
        })

        receiveMessage('project-message', data => {
            if (data.sender._id === 'ai') {
                try {
                    const message = JSON.parse(data.message)
                    if (message.fileTree) {
                        setFileTree(message.fileTree)
                        getWebContainer().then(container => {
                            container.mount(message.fileTree)
                        })
                    }
                } catch {
                    // Invalid JSON, treat as regular message
                }
            }
            setMessages(prev => [...prev, data])
        })

        if (location.state?.project?._id) {
            axios.get(`/projects/get-project/${location.state.project._id}`)
                .then(res => {
                    setProject(res.data.project)
                    setFileTree(res.data.project.fileTree || {})
                })
                .catch(() => {})
        }

        axios.get('/users/all')
            .then(res => setUsers(res.data.users))
            .catch(() => {})

    }, [project?._id, location.state?.project?._id])

    useEffect(() => {
        if (messageBox.current) {
            messageBox.current.scrollTop = messageBox.current.scrollHeight
        }
    }, [messages])

    if (!project) {
        return (
            <main className='h-screen w-screen flex items-center justify-center bg-gray-100'>
                <div className="text-gray-600">No project selected</div>
            </main>
        )
    }

    return (
        <main className='h-screen w-screen flex'>
            <section className="left relative flex flex-col h-screen min-w-96 bg-slate-300">
                <header className='flex justify-between items-center p-3 px-4 w-full bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200 absolute z-10 top-0 shadow-sm'>
                    <button 
                        className='flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg' 
                        onClick={() => setIsModalOpen(true)}>
                        <i className="ri-add-fill text-lg"></i>
                        <p>Add collaborator</p>
                    </button>
                    <button 
                        onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} 
                        className='p-2.5 rounded-lg bg-white hover:bg-slate-100 transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md border border-slate-200'>
                        <i className="ri-group-fill text-lg text-gray-700"></i>
                    </button>
                </header>
                
                <div className="conversation-area pt-14 pb-10 grow flex flex-col h-full relative">
                    <div
                        ref={messageBox}
                        className="message-box p-1 grow flex flex-col gap-1 overflow-auto max-h-full scrollbar-hide">
                        {messages.map((msg, index) => (
                            <div 
                                key={index} 
                                className={`${msg.sender._id === 'ai' ? 'max-w-80' : 'max-w-52'} ${msg.sender._id === user._id.toString() && 'ml-auto'} message flex flex-col p-3 w-fit rounded-xl shadow-md hover:shadow-lg transition-all duration-200 ${
                                    msg.sender._id === 'ai' 
                                        ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200' 
                                        : msg.sender._id === user._id.toString()
                                        ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white'
                                        : 'bg-white border border-slate-200'
                                }`}>
                                <small className={`text-xs font-medium mb-1 ${
                                    msg.sender._id === user._id.toString() ? 'text-white/90' : 'text-gray-600'
                                }`}>
                                    {msg.sender.email}
                                </small>
                                <div className={`text-sm ${
                                    msg.sender._id === user._id.toString() ? 'text-white' : 'text-gray-900'
                                }`}>
                                    {msg.sender._id === 'ai' ?
                                        WriteAiMessage(msg.message)
                                        : <p>{msg.message}</p>}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="inputField w-full flex absolute bottom-0 bg-white border-t border-slate-200 shadow-lg">
                        <input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    send()
                                }
                            }}
                            className='p-3 px-4 border-none outline-none grow bg-transparent text-gray-800 placeholder-gray-400' 
                            type="text" 
                            placeholder='Type your message...' />
                        <button
                            onClick={send}
                            disabled={!message.trim()}
                            className='px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 shadow-md'>
                            <i className="ri-send-plane-fill text-lg"></i>
                        </button>
                    </div>
                </div>

                <div className={`sidePanel w-full h-full flex flex-col gap-2 bg-slate-50 absolute transition-all ${isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'} top-0 z-20`}>
                    <header className='flex justify-between items-center px-4 p-2 bg-slate-200'>
                        <h1 className='font-semibold text-lg'>Collaborators</h1>
                        <button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} className='p-2 hover:bg-slate-300 rounded transition-colors'>
                            <i className="ri-close-fill text-xl text-gray-700"></i>
                        </button>
                    </header>
                    <div className="users flex flex-col gap-2">
                        {project.users?.map((user, index) => (
                            <div key={index} className="user cursor-pointer hover:bg-slate-200 p-2 flex gap-2 items-center">
                                <div className='w-10 h-10 rounded-full flex items-center justify-center text-white bg-gradient-to-br from-slate-600 to-slate-700 shadow-md'>
                                    <i className="ri-user-fill text-lg"></i>
                                </div>
                                <h1 className='font-semibold text-lg'>{user.email}</h1>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="right bg-red-50 grow h-full flex">
                <div className="code-editor flex flex-col grow h-full shrink">
                    <div className="w-full h-full overflow-hidden">
                        <CodePlayground />
                    </div>
                </div>
            </section>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-4 rounded-md w-96 max-w-full relative">
                        <header className='flex justify-between items-center mb-4'>
                            <h2 className='text-xl font-semibold'>Select User</h2>
                            <button onClick={() => setIsModalOpen(false)} className='p-2 hover:bg-gray-100 rounded transition-colors'>
                                <i className="ri-close-fill text-xl text-gray-700"></i>
                            </button>
                        </header>
                        <div className="users-list flex flex-col gap-2 mb-16 max-h-96 overflow-auto">
                            {users.map(user => (
                                <div 
                                    key={user._id} 
                                    className={`user cursor-pointer hover:bg-slate-200 ${selectedUserId.has(user._id) ? 'bg-slate-200' : ""} p-2 flex gap-2 items-center`} 
                                    onClick={() => handleUserClick(user._id)}>
                                    <div className='w-10 h-10 rounded-full flex items-center justify-center text-white bg-gradient-to-br from-slate-600 to-slate-700 shadow-md'>
                                        <i className="ri-user-fill text-lg"></i>
                                    </div>
                                    <h1 className='font-semibold text-lg'>{user.email}</h1>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={addCollaborators}
                            className='absolute bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl'>
                            Add Collaborators
                        </button>
                    </div>
                </div>
            )}
        </main>
    )
}

export default Project
