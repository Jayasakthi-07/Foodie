import { Link } from 'react-router-dom';
import { FiFacebook, FiTwitter, FiInstagram, FiMail } from 'react-icons/fi';

const Footer = () => {
  return (
    <footer className="bg-charcoal-900 text-charcoal-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-white">Foodie</h3>
            <p className="text-charcoal-400">
              Authentic South Indian cuisine delivered to your doorstep. Experience the rich flavors of South India.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-charcoal-400 hover:text-saffron-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/menu" className="text-charcoal-400 hover:text-saffron-400 transition-colors">
                  Menu
                </Link>
              </li>
              <li>
                <Link to="/orders" className="text-charcoal-400 hover:text-saffron-400 transition-colors">
                  Orders
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-charcoal-400 hover:text-saffron-400 transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-charcoal-400 hover:text-saffron-400 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Support</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-charcoal-400 hover:text-saffron-400 transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-charcoal-400 hover:text-saffron-400 transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="text-charcoal-400 hover:text-saffron-400 transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Follow Us</h4>
            <div className="flex space-x-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-charcoal-800 flex items-center justify-center hover:bg-saffron-500 transition-colors"
                aria-label="Facebook"
              >
                <FiFacebook className="w-5 h-5" />
              </a>
              <a
                href="https://x.com/jayasakthi_"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-charcoal-800 flex items-center justify-center hover:bg-saffron-500 transition-colors"
                aria-label="Twitter"
              >
                <FiTwitter className="w-5 h-5" />
              </a>
              <a
                href="https://www.instagram.com/sev7en.exe/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-charcoal-800 flex items-center justify-center hover:bg-saffron-500 transition-colors"
                aria-label="Instagram"
              >
                <FiInstagram className="w-5 h-5" />
              </a>
              <a
                href="mailto:jayasakthidharmarajan@gmail.com"
                className="w-10 h-10 rounded-full bg-charcoal-800 flex items-center justify-center hover:bg-saffron-500 transition-colors"
                aria-label="Email"
              >
                <FiMail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-charcoal-800 mt-8 pt-8 text-center text-charcoal-400">
          <p>&copy; {new Date().getFullYear()} Foodie. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

