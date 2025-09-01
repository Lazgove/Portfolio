import React, { useState, useRef } from "react";
import Draggable from "react-draggable";
import { User, Code, X } from "lucide-react";
import windowsWallpaper from "/models/windows.jpg";

export default function HeroPage() {
  const folders = [
    { name: "Projects", icon: <Code className="w-20 h-20" />, content: "This is your Projects folder" },
    { name: "About", icon: <User className="w-20 h-20" />, content: "This is your About folder" },
  ];

  const desktopRef = useRef(null);

  const [openWindows, setOpenWindows] = useState([]);

  const openFolder = (folder) => {
    if (!desktopRef.current) return;

    const desktopWidth = desktopRef.current.clientWidth;
    const desktopHeight = desktopRef.current.clientHeight;

    const windowWidth = 600;
    const windowHeight = 400;

    // calculate center position
    const x = (desktopWidth - windowWidth) / 2;
    const y = (desktopHeight - windowHeight) / 2;

    setOpenWindows([
      ...openWindows,
      { ...folder, defaultPosition: { x, y } },
    ]);
  };

  const closeWindow = (index) => {
    setOpenWindows(openWindows.filter((_, i) => i !== index));
  };

  return (
    <div
      ref={desktopRef}
      className="relative w-[2550px] h-[1322px] overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: `url(${windowsWallpaper})` }}
    >
      {/* Folders */}
      <div className="absolute top-10 left-10 flex flex-col space-y-16">
        {folders.map((folder) => (
          <div
            key={folder.name}
            className="flex flex-col items-center text-white group cursor-pointer"
            onClick={() => openFolder(folder)}
          >
            <div className="bg-blue-500/80 rounded-xl p-8 flex items-center justify-center group-hover:bg-blue-600 transition">
              {folder.icon}
            </div>
            <span className="mt-4 text-3xl font-semibold">{folder.name}</span>
          </div>
        ))}
      </div>

      {/* Draggable windows */}
      {openWindows.map((folder, index) => (
        <Draggable
          key={index}
          bounds="parent"
          handle=".window-header"
          defaultPosition={folder.defaultPosition}
        >
          <div className="absolute w-[1000px] h-[800px] bg-white shadow-xl border border-gray-400 rounded-md flex flex-col">
            {/* Window header */}
            <div className="window-header bg-blue-600 text-white flex justify-between items-center px-4 py-2 cursor-move">
              <span className="font-bold">{folder.name}</span>
              <button onClick={() => closeWindow(index)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            {/* Window content */}
            <div className="p-4 flex-1 overflow-auto">{folder.content}</div>
          </div>
        </Draggable>
      ))}

      {/* Taskbar */}
      <div className="absolute bottom-0 left-0 w-full h-20 bg-black/80 flex items-center px-6 space-x-6">
        <div className="bg-green-600 w-16 h-16 rounded-sm flex items-center justify-center">
          <span className="text-white text-4xl font-bold">⊞</span>
        </div>
        <span className="text-gray-300 text-2xl">Start</span>
      </div>
    </div>
  );
}
