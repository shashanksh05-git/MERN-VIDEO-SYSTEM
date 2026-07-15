import React from "react";
import PlanUpgrade from "./PlanUpgrade";
import { useUser } from "@/lib/AuthContext";

const PlansContent = () => {
  const { user } = useUser();

  return (
    <main className="flex-1 p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Plans</h1>
        <p className="text-gray-500">
          Upgrade your plan to increase your video watching limit.
        </p>
      </div>

      {user ? (
        <PlanUpgrade />
      ) : (
        <p className="text-gray-500">Please login to upgrade your plan.</p>
      )}
    </main>
  );
};

export default PlansContent;