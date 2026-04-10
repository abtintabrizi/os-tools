import { Map, PersonStanding } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Changelog from "@/features/common/components/Changelog";

const btnBase =
  "flex flex-col items-center gap-5 justify-center w-full bg-tools-graphite hover:bg-white/10 border border-white/7 rounded-lg px-2 py-20 font-head text-2xl font-semibold text-white transition-colors duration-200";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="h-screen grid grid-cols-3 gap-4 p-4">
      <div className="col-start-2 flex justify-center items-center">
        <div className="w-full max-w-160 flex flex-col">
          <h1 className="text-7xl font-extrabold leading-none tracking-tight mb-10">
            OS <span className="text-tools-gold">Tools</span>
          </h1>

          <div className="bg-tools-carbon border border-white/7 rounded-2xl p-6 flex flex-row gap-5">
            <button className={btnBase} onClick={() => navigate("/map-draft")}>
              <Map size={60} />
              Map Draft
            </button>
            <button
              className={btnBase}
              onClick={() => navigate("/striker-draft")}
            >
              <PersonStanding size={60} />
              Striker Draft
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-center items-center">
        <Changelog />
      </div>
    </div>
  );
}
