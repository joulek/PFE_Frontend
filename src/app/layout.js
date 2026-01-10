import "./globals.css";
import Navbar from "./components/Navbar";

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="bg-[#F6F8F6]">
        <Navbar />
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
