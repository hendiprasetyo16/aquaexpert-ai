"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  createPlant,
  updatePlant,
  deletePlant,
  uploadPlantImage,
} from "../repositories/plant.repository";

import { Plant } from "../types/plant.types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

import {
  Loader2,
  ImagePlus,
  Trash2,
} from "lucide-react";

interface PlantFormProps {
  mode?: "create" | "edit";
  plant?: Plant;
}

export default function PlantForm({
  mode = "create",
  plant,
}: PlantFormProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);

  const [formData, setFormData] = useState({
    name: "",
    scientific_name: "",
    placement: "Midground",
    difficulty: "Mudah",
    light_requirement: "Sedang",
    co2_requirement: "Rendah",
  });

  useEffect(() => {
    if (mode === "edit" && plant) {
      setFormData({
        name: plant.name || "",
        scientific_name: plant.scientific_name || "",
        placement: plant.placement || "Midground",
        difficulty: plant.difficulty || "Mudah",
        light_requirement: plant.light_requirement || "Sedang",
        co2_requirement: plant.co2_requirement || "Rendah",
      });

      if (plant.image_url) {
        setPreviewImage(plant.image_url);
      }
    }
  }, [plant, mode]);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  function handleImageChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      const validTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/jpg",
      ];

      if (!validTypes.includes(file.type)) {
        setError("Format gambar harus JPG, PNG atau WEBP.");
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        setError("Ukuran gambar maksimal 2MB.");
        return;
      }

      setError(null);
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      let imageUrl = plant?.image_url || "";

      if (imageFile) {
        imageUrl = await uploadPlantImage(
          imageFile,
          formData.name
        );
      }

      const payload = {
        ...formData,
        image_url: imageUrl || "",
      };

      if (mode === "create") {
        await createPlant(payload);
      } else {
        await updatePlant(plant!.id, payload);
      }

      router.push("/dashboard/plants");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!plant || mode !== "edit") return;

    const confirmDelete = window.confirm(
      `Hapus tanaman ${plant.name}?`
    );

    if (!confirmDelete) return;

    try {
      setLoading(true);

      await deletePlant(plant.id);

      router.push("/dashboard/plants");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Gagal menghapus tanaman.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-slate-800 bg-slate-900/60">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* BAGIAN GAMBAR YANG SUDAH DIPERBAIKI */}
          <div className="space-y-4">
            <Label className="text-slate-300">
              Gambar Tanaman
            </Label>

            <input
              id="plant-image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              key={fileInputKey}
            />

            <label
              htmlFor="plant-image"
              className="cursor-pointer block"
            >
              <div className="overflow-hidden rounded-lg border border-slate-700 hover:border-teal-500 transition">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="h-64 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-64 items-center justify-center bg-slate-800">
                    <div className="text-center">
                      <ImagePlus className="mx-auto h-12 w-12 text-slate-500" />
                      <p className="mt-2 text-sm text-slate-400">
                        Klik untuk memilih gambar
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </label>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-slate-300">Nama Tanaman</Label>
              <Input
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="bg-slate-950 border-slate-700 text-slate-100"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Nama Ilmiah</Label>
              <Input
                name="scientific_name"
                value={formData.scientific_name}
                onChange={handleChange}
                className="bg-slate-950 border-slate-700 text-slate-100"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Tingkat Kesulitan</Label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-slate-100"
              >
                <option>Mudah</option>
                <option>Sedang</option>
                <option>Sulit</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Posisi</Label>
              <select
                name="placement"
                value={formData.placement}
                onChange={handleChange}
                className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-slate-100"
              >
                <option>Foreground</option>
                <option>Midground</option>
                <option>Background</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Cahaya</Label>
              <select
                name="light_requirement"
                value={formData.light_requirement}
                onChange={handleChange}
                className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-slate-100"
              >
                <option>Rendah</option>
                <option>Sedang</option>
                <option>Tinggi</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">CO2</Label>
              <select
                name="co2_requirement"
                value={formData.co2_requirement}
                onChange={handleChange}
                className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-slate-100"
              >
                <option>Tanpa Injeksi</option>
                <option>Rendah</option>
                <option>Tinggi</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="rounded border border-red-900 bg-red-950/50 p-3 text-red-400">
              {error}
            </div>
          )}

          <div className="flex justify-between border-t border-slate-800 pt-6">
            <div>
              {mode === "edit" && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus
                </Button>
              )}
            </div>

            <div className="flex gap-3">
              {/* TOMBOL BATAL YANG SUDAH DIPERBAIKI */}
              <Button
                type="button"
                onClick={() => router.back()}
                className="bg-slate-700 text-white hover:bg-slate-600"
              >
                Batal
              </Button>

              <Button
                type="submit"
                disabled={loading}
                className="bg-teal-600 hover:bg-teal-500"
              >
                {loading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {mode === "create"
                  ? "Simpan Tanaman"
                  : "Update Tanaman"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}