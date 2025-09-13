"use client";

import { useRouter } from "next/navigation";
import { Card, CardBody } from "@nextui-org/react";
import Image from "next/image";

interface Category {
  idCategory: number;
  name: string;
  categoryImageUrl: string;
}

export default function CategoryList({ data }: { data?: Category[] }) {
  const router = useRouter();

  if (!data?.length) {
    return (
      <p className="p-2 text-gray-500 italic text-sm">
        Kategori tidak ditemukan
      </p>
    );
  }

  return (
    <div className="mx-auto p-1 md:p-2 lg:p-8 mt-4">
      <h1 className="flex items-center justify-center gap-2 text-3xl font-extrabold text-gray-800 mb-6">
        Kategori Produk
      </h1>

      {/* Daftar kategori sebaris + scroll horizontal */}
      <div className="flex gap-3 overflow-x-auto pb-2 justify-between">
        {data.map((category) => (
          <Card
            key={category.idCategory}
            isPressable
            shadow="sm"
            className="flex-shrink-0 w-20 md:w-24 lg:w-28 flex flex-col items-center justify-center p-2
                       hover:shadow-lg hover:scale-105 
                       transition-transform duration-200 ease-in-out"
            onPress={() =>
              router.push(`/products?category=${category.idCategory}`)
            }
          >
            <CardBody className="p-0 flex justify-center items-center">
              <Image
                src={category.categoryImageUrl || "/fallback.jpg"}
                alt={category.name}
                width={80}
                height={80}
                className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 object-cover rounded-full border border-gray-200 shadow-sm"
                draggable={false}
                loading="lazy"
              />
            </CardBody>
            <p className="mt-1 text-[10px] md:text-xs lg:text-sm font-medium text-center text-gray-700">
              {category.name}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
