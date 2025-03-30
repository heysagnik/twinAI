import { useState } from "react";
import { Box, Image, Video, ChevronDown, Sparkles } from "lucide-react";
import FeatureCard from "./components/FeatureCard";

export default function App() {
  const [message, setMessage] = useState("");
  const [selectedMode, setSelectedMode] = useState("3D Object");

  const features = [
    {
      title: "Help me to create 3D object",
      icon: Box,
      gradient: ["#6366f1", "#8b5cf6"],
      mode: "3D Object"
    },
    {
      title: "Help me to create comic",
      icon: Image,
      gradient: ["#3b82f6", "#06b6d4"],
      mode: "Comic"
    },
    {
      title: "Help me to create video",
      icon: Video,
      gradient: ["#ec4899", "#f43f5e"],
      mode: "Video"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      {/* Logo Animation */}
      <div className="mb-6 animate-float">
        <div className="w-12 h-12 relative">
          <Sparkles className="w-full h-full text-blue-400 animate-pulse-slow" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6">
            <div className="w-full h-full bg-blue-400 rounded-full blur-sm animate-pulse-slow"></div>
          </div>
        </div>
      </div>

      {/* Welcome Text */}
      <div className="text-center mb-12">
        <h2 className="text-gray-400 mb-3">Welcome to Leonardo AI</h2>
        <h1 className="text-4xl font-semibold mb-8">How can I help?</h1>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl w-full mb-12">
        {features.map((feature) => (
          <FeatureCard
            key={feature.mode}
            {...feature}
            onClick={() => setSelectedMode(feature.mode)}
          />
        ))}
      </div>

      {/* Input Area */}
      <div className="w-full max-w-2xl">
        <div className="glass-card p-1">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 mb-1">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Box className="w-4 h-4" />
              {selectedMode}
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
          <div className="relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What do you want to see..."
              className="w-full bg-transparent px-4 py-3 text-white placeholder-gray-500 focus:outline-none"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center hover:opacity-90 transition-opacity">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}