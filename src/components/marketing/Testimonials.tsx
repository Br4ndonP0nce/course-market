export function Testimonials() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container px-4 md:px-6 mx-auto max-w-7xl">
        <div className="flex flex-col items-center space-y-4 text-center mb-12">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
              Success Stories
            </h2>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
              Here's what creators are saying about CourseHub.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-lg border bg-white p-8 shadow-sm">
            <div className="flex items-center space-x-4 mb-6">
              <div className="rounded-full bg-gray-100 p-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-10 w-10 text-gray-400"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Sarah Johnson</h3>
                <p className="text-sm text-gray-500">Yoga Instructor</p>
              </div>
            </div>
            <p className="text-gray-600 italic">
              "Since launching my online yoga courses on CourseHub, I've been
              able to reach students across the world. The platform made it
              incredibly easy to upload my content and start selling."
            </p>
            <div className="flex mt-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  stroke="none"
                  className="h-5 w-5 text-yellow-400"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </div>
          </div>
          <div className="rounded-lg border bg-white p-8 shadow-sm">
            <div className="flex items-center space-x-4 mb-6">
              <div className="rounded-full bg-gray-100 p-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-10 w-10 text-gray-400"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Mark Davis</h3>
                <p className="text-sm text-gray-500">Marketing Expert</p>
              </div>
            </div>
            <p className="text-gray-600 italic">
              "I've tried several platforms, but CourseHub has by far the best
              creator tools. The analytics dashboard helps me understand what's
              working and optimize my course content."
            </p>
            <div className="flex mt-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  stroke="none"
                  className="h-5 w-5 text-yellow-400"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </div>
          </div>
          <div className="rounded-lg border bg-white p-8 shadow-sm">
            <div className="flex items-center space-x-4 mb-6">
              <div className="rounded-full bg-gray-100 p-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-10 w-10 text-gray-400"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Emily Chen</h3>
                <p className="text-sm text-gray-500">Design Educator</p>
              </div>
            </div>
            <p className="text-gray-600 italic">
              "In just 6 months, my design courses have generated more income
              than my full-time job. The platform handles all the technical
              aspects so I can focus on creating great content."
            </p>
            <div className="flex mt-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  stroke="none"
                  className="h-5 w-5 text-yellow-400"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
