const AgencyCard = ({ name, description, logo, color }) => {
  return (
    <div className="relative group cursor-pointer">
      <div className={`aspect-video rounded-lg ${color} p-6 flex flex-col justify-between transition-transform group-hover:scale-[1.02]`}>
        <div className="text-2xl font-medium text-black/90">{name}</div>
        <img src={logo} alt={name} className="w-32" />
      </div>
      <div className="mt-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
            <img src={logo} alt={name} className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{name}</div>
            <div className="text-xs text-gray-500">{description}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RecommendedAgencies = ({ agencies }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-gray-900">Recommended Agencies</h2>
          <span className="text-xs text-gray-500 px-1.5 py-0.5 bg-gray-100 rounded">Ad</span>
        </div>
        <button className="text-sm text-gray-500 hover:text-gray-700">View All</button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {agencies.map((agency) => (
          <AgencyCard key={agency.name} {...agency} />
        ))}
      </div>
    </div>
  );
};

export default RecommendedAgencies; 