import Link from "next/link";
import Image from "next/image";
import { Copyright } from "lucide-react";

const Footer = () => {
    return (
        <div className="bg-gray-400 p-8 flex flex-col gap-8">
            {/* Bagian Atas */}
            <div className="flex flex-col gap-8 items-center md:flex-row md:items-start md:justify-between">
                
                {/* Logo + Alamat */}
                <div className="flex flex-col gap-4 items-center md:items-start">
                    <Link className="flex items-center" href="/">
                        <Image
                            className="w-6 h-6 md:w-9 md:h-9"
                            src="/rootImage/icon.png"
                            alt="Bomi E-commerce"
                            width={40}
                            height={40}
                        />
                        <p className="hidden md:block text-md font-medium tracking-wider text-white">
                            BOMI-Ecommerce.com
                        </p>
                    </Link>

                    {/* Alamat */}
                    <div className="flex flex-col text-sm text-gray-800 gap-1 text-center md:text-left p-2">
                        <p>Jl. Mawar No. 123</p>
                        <p>Jakarta, Indonesia</p>
                        <p>Kode Pos 12345</p>
                    </div>
                </div>

                {/* Links */}
                <div className="flex flex-col gap-4 text-sm text-gray-700 items-center md:items-start">
                    <p className="text-sm text-amber-50">Perusahaan</p>
                    <Link href="/">Tentang Kami</Link>
                    <Link href="/">Blog</Link>
                    <Link href="/products">Produk</Link>
                </div>

                {/* Kontak Kami */}
                <div className="flex flex-col gap-4 text-sm text-gray-700 items-center md:items-start">
                    <p className="text-sm text-amber-50">Kontak Kami</p>
                    <p>Email: bomiecommerce@gmail.com</p>
                    <p>Instagram: BomiEcommerce</p>
                </div>

                {/* Download */}
                <div className="flex flex-col gap-4 text-sm text-gray-700 items-center md:items-start">
                    <p className="text-sm text-amber-50">Download</p>
                    <Link href="/">Playstore</Link>
                </div>
            </div>

            {/* All Rights Reserved - Tengah Bawah */}
            <div className="flex items-center justify-center text-sm text-gray-800 mt-2">
                <Copyright className="w-4 h-4 text-gray-800 mr-0.5" />
                <span> 2025 Bomi E-Commerce - All rights reserved.</span>
            </div>
        </div>
    );
};

export default Footer;
