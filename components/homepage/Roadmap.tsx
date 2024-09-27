import React from 'react'

function Roadmap2() {
    return (
        <div id='roadmap' className='py-24 lg:py-32 bg-gradient-to-b from-gray-900 to-black text-white'>
            <div className='lg:w-5/6 mx-auto px-7 lg:px-0'>
                <h2 className='text-4xl text-sky-500 text-center font-bold mb-10'>
                    Our Roadmap
                </h2>

                <div className='mt-14 bg-gray-800 bg-opacity-50 py-14 px-5 rounded-lg shadow-lg'>
                    <ul className="timeline timeline-snap-icon max-md:timeline-compact timeline-vertical space-y-12">
                        <li>
                            <div className="timeline-middle text-gray-200">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-sky-400">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m9 12.75 3 3m0 0 3-3m-3 3v-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                            </div>
                            <div className="timeline-end mb-10">
                                <div className="text-xl font-bold text-gray-200">Phase 1: NFT Marketplace & Launchpad Debut</div>
                                <ul className='mt-4 space-y-2'>
                                    <li className='flex items-start gap-3'>
                                        <span className='text-sky-100'>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                                            </svg>
                                        </span>
                                        <span>Introduction of exclusive merchandise available for purchase through our platform.</span>
                                    </li>
                                    <li className='flex items-start gap-3'>
                                        <span className='text-sky-100'>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                                            </svg>
                                        </span>
                                        <span>VRM Integration inside the Marketplace. Buy, Sell, and Mint your Avatar for the Metaverse.</span>
                                    </li>
                                    <li className='flex items-start gap-3'>
                                        <span className='text-sky-100'>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                                            </svg>
                                        </span>
                                        <span>Launching with 2800 unique NFTs, enabling marketplace revenue and prioritized launch access for members.</span>
                                    </li>
                                </ul>
                            </div>
                            <hr className='bg-accent' />
                        </li>

                        <li>
                            <div className="timeline-middle text-gray-200">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-sky-400">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m9 12.75 3 3m0 0 3-3m-3 3v-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                            </div>
                            <div className="timeline-start mb-10">
                                <div className="text-xl font-bold text-gray-200">Phase 2: Expansion into Web3 E-commerce</div>
                                <ul className='mt-4 space-y-2'>
                                <li className='flex items-start gap-3'>
                                        <span className='text-sky-100'>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                                            </svg>
                                        </span>
                                        <span>MultiChain Marketplace Integration: Expanding Across All Chains Connected by IoTube Bridge</span>
                                    </li>
                                    <li className='flex items-start gap-3'>
                                        <span className='text-sky-100'>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                                            </svg>
                                        </span>
                                        <span>Seamless credit card integration for straightforward NFT purchases.</span>
                                    </li>
                                    <li className='flex items-start gap-3'>
                                        <span className='text-sky-100'>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                                            </svg>
                                        </span>
                                        <span>Opportunity to become a verified seller and join our growing web3 marketplace.</span>
                                    </li>
                                </ul>
                            </div>
                            <hr className='bg-accent' />
                        </li>

                        <li>
                            <div className="timeline-middle text-gray-200">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-sky-400">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m9 12.75 3 3m0 0 3-3m-3 3v-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                            </div>
                            <div className="timeline-end mb-10">
                                <div className="text-xl font-bold text-gray-200">Phase 3: Open Source and Community Growth</div>
                                <ul className='mt-4 space-y-2'>
                                    <li className='flex items-start gap-3'>
                                        <span className='text-sky-100'>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                                            </svg>
                                        </span>
                                        <span>Facilitate easy website creation for showcasing and selling NFTs with our PlasmaVerse Gallery.</span>
                                    </li>
                                    <li className='flex items-start gap-3'>
                                        <span className='text-sky-100'>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                                            </svg>
                                        </span>
                                        <span>Expand access to a fully integrated Web3 Store, giving everyone an easy way to handle their Web3 store.</span>
                                    </li>
                                </ul>
                            </div>
                            <hr className='bg-accent' />
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default Roadmap2
