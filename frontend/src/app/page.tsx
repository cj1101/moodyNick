import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          MoodyNick
        </h1>
        <p className="text-2xl text-gray-700 mb-4">
          Design Your Own Custom Products
        </p>
        <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
          Create unique designs with our intuitive design tool. Add artwork, customize text, 
          and bring your creative vision to life on high-quality products.
        </p>
        
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/shop"
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            Start Designing
          </Link>
          <Link
            href="/register"
            className="bg-white text-purple-600 px-8 py-4 rounded-lg font-semibold text-lg border-2 border-purple-600 hover:bg-purple-50 transition-all duration-300"
          >
            Sign Up Free
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">1. Choose a Product</h3>
            <p className="text-gray-600">
              Browse our catalog of high-quality products ready for your custom design.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">2. Design It</h3>
            <p className="text-gray-600">
              Use our powerful design tool to add artwork, text, and make it uniquely yours.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow">
            <div className="text-4xl mb-4">📦</div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">3. Order & Enjoy</h3>
            <p className="text-gray-600">
              Place your order and we'll print and ship your custom product directly to you.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-12 text-white max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to Create Something Amazing?</h2>
          <p className="text-lg mb-8 opacity-90">
            Join thousands of creators who are bringing their ideas to life.
          </p>
          <Link
            href="/shop"
            className="bg-white text-purple-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors inline-block"
          >
            Browse Products
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600 border-t">
        <p>&copy; 2025 MoodyNick. All rights reserved.</p>
      </footer>
    </div>
  );
}
