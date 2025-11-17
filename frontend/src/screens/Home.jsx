
import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from "../config/axios"
import { UserContext } from '../context/user.context'

const Home = () => {

    const { user } = useContext(UserContext)
    const [ isModalOpen, setIsModalOpen ] = useState(false)
    const [ projectName, setProjectName ] = useState(null)
    const [ project, setProject ] = useState([])

    const navigate = useNavigate()

    function createProject(e) {
        e.preventDefault()
        console.log({ projectName })

        axios.post('/projects/create', {
            name: projectName,
        })
            .then((res) => {
                console.log(res)
                setIsModalOpen(false)
                setProjectName('')
                // Refresh projects list
                axios.get('/projects/all').then((res) => {
                    setProject(res.data.projects)
                }).catch(err => {
                    console.log(err)
                })
            })
            .catch((error) => {
                console.log(error)
            })
    }

    useEffect(() => {
        axios.get('/projects/all').then((res) => {
            setProject(res.data.projects)

        }).catch(err => {
            console.log(err)
        })

    }, [])

    return (
        <main className='p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen'>
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">My Projects</h1>
            </div>
            <div className="projects flex flex-wrap gap-4">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="group relative project p-6 border-2 border-dashed border-blue-400 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-blue-500 min-w-64">
                    <div className="flex items-center justify-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform duration-300 shadow-md">
                            <i className="ri-add-line text-2xl"></i>
                        </div>
                        <span className="font-semibold text-lg text-gray-700 group-hover:text-blue-700 transition-colors">New Project</span>
                    </div>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/0 via-blue-400/0 to-indigo-400/0 group-hover:from-blue-400/10 group-hover:via-blue-400/5 group-hover:to-indigo-400/10 transition-all duration-500"></div>
                </button>

                {
                    project.map((project) => (
                        <div key={project._id}
                            onClick={() => {
                                navigate(`/project`, {
                                    state: { project }
                                })
                            }}
                            className="group project flex flex-col gap-3 cursor-pointer p-6 border border-slate-200 rounded-xl min-w-64 bg-white hover:bg-gradient-to-br hover:from-white hover:to-blue-50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-blue-300 hover:-translate-y-1">
                            <div className="flex items-start justify-between">
                                <h2 className='font-bold text-xl text-gray-800 group-hover:text-blue-700 transition-colors'>
                                    {project.name}
                                </h2>
                                <div className="w-2 h-2 rounded-full bg-green-500 group-hover:scale-150 transition-transform shadow-sm"></div>
                            </div>

                            <div className="flex items-center gap-2 text-gray-600 group-hover:text-gray-700 transition-colors">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                                    <i className="ri-user-line text-sm"></i>
                                </div>
                                <p className="text-sm font-medium">
                                    <span className="font-semibold">{project.users.length}</span> Collaborator{project.users.length !== 1 ? 's' : ''}
                                </p>
                            </div>

                            <div className="mt-2 pt-3 border-t border-slate-200 group-hover:border-blue-200 transition-colors">
                                <p className="text-xs text-gray-500 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                                    <i className="ri-arrow-right-line"></i>
                                    Click to open
                                </p>
                            </div>
                        </div>
                    ))
                }


            </div>

            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 animate-fadeIn">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md transform transition-all animate-scaleIn border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Create New Project</h2>
                            <button 
                                onClick={() => setIsModalOpen(false)} 
                                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-500 hover:text-gray-700">
                                <i className="ri-close-line text-xl"></i>
                            </button>
                        </div>
                        <form onSubmit={createProject}>
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Project Name</label>
                                <input
                                    onChange={(e) => setProjectName(e.target.value)}
                                    value={projectName}
                                    type="text" 
                                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                                    placeholder="Enter project name"
                                    required />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button 
                                    type="button" 
                                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95" 
                                    onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl">
                                    Create Project
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


        </main>
    )
}

export default Home