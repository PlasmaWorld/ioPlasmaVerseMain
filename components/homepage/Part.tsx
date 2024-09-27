import React, { useState } from 'react';
import ContactUs from './ContactUs';

const Part: React.FC = () => {
  const [showModal, setShowModal] = useState<boolean>(false);

  const toggleModal = () => {
    setShowModal(!showModal);
  };

  return (
    <div id="meet" data-aos="fade-up" data-aos-duration="2000" className="pt-14 pb-36 bg-center">
      <div className="max-w-7xl mx-auto px-7 2xl:px-0">
        <h1 className="text-white text-2xl font-semibold text-center pt-20">Be a part of the team</h1>
        <p className="mt-5 px-5 text-white lg:text-xl pt-3 lg:pt-5 lg:w-2/3 mx-auto text-center">
          Join the team  and be a part of the community. Get the latest updates and news about the project.
        </p>
        <div className="lg:mt-12 mt-16 flex flex-col lg:flex-row gap-2 lg:gap-5 justify-center items-center px-5 lg:px-0">
          <button onClick={toggleModal} className="bg-sky-500 hover:bg-gray-300 hover:text-gray-800 transition duration-200 text-white py-4 px-10 rounded-full">
            ContactUs
          </button>
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
              <div className="bg-white p-8 max-w-md mx-auto rounded-lg flex flex-col items-center">
                <ContactUs onClose={toggleModal} />
                <button onClick={toggleModal} className="mt-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Part;
