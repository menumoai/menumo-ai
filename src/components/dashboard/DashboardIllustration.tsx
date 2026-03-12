export function DashboardIllustration() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl shadow-2xl p-6 space-y-4 border-2 border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Today's Dashboard</h3>
              <p className="text-sm text-gray-500">Tuesday, Dec 30</p>
            </div>
          </div>
          <div className="px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium">
            On Track
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-4">
            <div className="text-sm text-orange-700 mb-1">Predicted Sales</div>
            <div className="text-2xl font-bold text-orange-900">$842</div>
            <div className="text-xs text-orange-600 mt-1">↑ 12% vs avg</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4">
            <div className="text-sm text-blue-700 mb-1">Orders</div>
            <div className="text-2xl font-bold text-blue-900">47</div>
            <div className="text-xs text-blue-600 mt-1">Peak at 12:30</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4">
            <div className="text-sm text-purple-700 mb-1">Waste</div>
            <div className="text-2xl font-bold text-purple-900">4%</div>
            <div className="text-xs text-purple-600 mt-1">↓ Better!</div>
          </div>
        </div>

        {/* AI Suggestion Card */}
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl p-5 border-2 border-teal-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-teal-900 mb-1">AI Prep Recommendation</h4>
              <p className="text-sm text-teal-800">
                Prep 15% more tacos today. Festival nearby + sunny weather = higher demand expected.
              </p>
            </div>
          </div>
        </div>

        {/* Popular Items */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700">Today's Hot Items</h4>
          <div className="space-y-2">
            {[
              { name: 'Classic Taco', count: 23, color: 'bg-yellow-400' },
              { name: 'Burrito Bowl', count: 18, color: 'bg-orange-400' },
              { name: 'Loaded Fries', count: 12, color: 'bg-red-400' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className={`w-2 h-2 ${item.color} rounded-full`}></div>
                <div className="flex-1 text-sm text-gray-700">{item.name}</div>
                <div className="text-sm font-semibold text-gray-900">{item.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
