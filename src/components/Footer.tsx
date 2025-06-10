export default function Footer() {
    return (
      <footer className="bg-black text-white py-6 mt-12">
        <div className="max-w-7xl mx-auto text-center text-sm">
          &copy; {new Date().getFullYear()} Muscle Up Gym. Todos los derechos reservados.
        </div>
      </footer>
    );
  }