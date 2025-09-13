import Image from "next/image";
import StarRating from "./StarRating";


interface Review {
  name: string;
  profileImageUrl?: string;
  createdAt: string;
  rating: number;
  comment: string;

}

export default function ReviewList({ reviews }: { reviews: Review[] }) {
  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-800">Ulasan</h2>
      <div className="mt-2 space-y-4">
        {reviews.length > 0 ? (
          reviews.map((review, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg shadow ">
              <div className="flex items-center gap-3">
                <Image
                  src={review.profileImageUrl}
                  alt={review.name}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover border" />

                <div>
                  <span className="font-semibold text-gray-800">{review.name}</span>
                  <span className="block text-xs text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString("id-ID")}
                  </span>
                </div>
              </div>

              <div className="mt-2">
                <StarRating rating={review.rating} />
              </div>

              <p className="text-gray-700 mt-2">{review.comment}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">Belum ada ulasan</p>
        )}
      </div>
    </section>
  );
}
