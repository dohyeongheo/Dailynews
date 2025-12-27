export default function Footer() {
  return (
    <footer className="mt-auto">
      <div className="bg-gray-800 text-gray-300 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm">
            <p>&copy; {new Date().getFullYear()} Daily News. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

