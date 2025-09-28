import React from 'react';

const Contact = () => {
  return (
    <section id="contact" className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Contact Us</h2>
          <p className="mt-4 text-lg text-gray-500">
            Have questions? We're here to help.
          </p>
        </div>
        <div className="mt-12">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="relative rounded-lg bg-white p-8 shadow-lg">
              <div className="absolute top-0 right-0 -mt-4 mr-4">
                <span className="inline-flex rounded-full bg-indigo-100 p-3">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </span>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Phone Support</h3>
              <p className="mt-4 text-base text-gray-500">
                Call us Monday through Friday<br />
                9:00 AM - 5:00 PM
              </p>
              <p className="mt-4 text-base font-medium text-indigo-600">
                +1 (555) 123-4567
              </p>
            </div>

            <div className="relative rounded-lg bg-white p-8 shadow-lg">
              <div className="absolute top-0 right-0 -mt-4 mr-4">
                <span className="inline-flex rounded-full bg-indigo-100 p-3">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Email</h3>
              <p className="mt-4 text-base text-gray-500">
                Send us an email anytime<br />
                We'll respond within 24 hours
              </p>
              <p className="mt-4 text-base font-medium text-indigo-600">
                support@indoornav.com
              </p>
            </div>

            <div className="relative rounded-lg bg-white p-8 shadow-lg">
              <div className="absolute top-0 right-0 -mt-4 mr-4">
                <span className="inline-flex rounded-full bg-indigo-100 p-3">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Office</h3>
              <p className="mt-4 text-base text-gray-500">
                123 Navigation Street<br />
                Tech City, TC 12345<br />
                United States
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;