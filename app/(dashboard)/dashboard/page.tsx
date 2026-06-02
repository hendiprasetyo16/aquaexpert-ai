"use client";

import { useEffect, useState } from "react";
import { getCurrentProfile } from "@/features/auth/repositories/user.repository";

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const data = await getCurrentProfile();

      console.log("PROFILE:", data);

      setProfile(data);
    }

    load();
  }, []);

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold">
        Dashboard AquaExpert AI
      </h1>

      {profile && (
        <div className="mt-6 rounded-lg border border-slate-700 p-4">
          <p>Nama : {profile.full_name}</p>
          <p>Email : {profile.email}</p>
          <p>Role : {profile.role}</p>
        </div>
      )}
    </div>
  );
}