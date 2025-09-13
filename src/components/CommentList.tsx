"use client";

import { Star } from "lucide-react";
import Image from "next/image";

interface Comment {
  idComment: number;
  comment: string;
  userName: string;
  profileUrl: string;
  nameProduct: string;
  rating: number;
}

export default function CommentList({ data }: { data: Comment[] }) {
  return (
    <div className="mx-auto p-8 md:p-2 lg:p-8 mt-4">
      <h1 className="flex items-center justify-center gap-2 text-3xl font-extrabold text-gray-800 mb-6">
        Testimoni Pelanggan
      </h1>

      {/* Flex responsive */}
      <div className="flex flex-wrap justify-between gap-6">
        {data.map((cmt) => (
          <div
            key={cmt.idComment}
            className="w-full md:w-[48%] lg:w-[23%] p-4 rounded-xl bg-gray-50 shadow-sm hover:shadow-md transition-shadow duration-300"
          >
            <div className="flex items-center gap-3 mb-3">
              <Image
                src={cmt.profileUrl || "/fallback-avatar.png"}
                alt={cmt.userName}
                width={48}
                height={48}
                className="rounded-full border-2 border-gray-300 object-cover"
                loading="lazy"
              />
              <div>
                <p className="font-semibold text-gray-800">{cmt.userName}</p>
                <p className="text-sm text-gray-500 italic">{cmt.nameProduct}</p>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(cmt.rating)
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-gray-300 fill-gray-300"
                      }`}
                    />
                  ))}
                  <span className="text-sm font-medium text-gray-700">
                    {cmt.rating}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed">{cmt.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
