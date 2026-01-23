import logo from '@/assets/logo-best-car-detailer-in-belfast.png';
import caretDown from '@/assets/icons/caret-down.svg'

export default function Header() {
    return (
        <header id="cs-navigation">
            <div className="cs-container">
                {/* Nav Logo */}
                <a href="https://camillusdetails.online" className="cs-logo" aria-label="back to home">
                    <img src={logo} alt="logo" width="197" height="43"
                        aria-hidden="true" decoding="async"/>
                </a>
                {/* <!--Navigation List */}
                <nav className="cs-nav" role="navigation">
                    {/* Mobile Nav Toggle */}
                    <button className="cs-toggle" aria-label="mobile menu toggle">
                        <div className="cs-box" aria-hidden="true">
                            <span className="cs-line cs-line1" aria-hidden="true"></span>
                            <span className="cs-line cs-line2" aria-hidden="true"></span>
                            <span className="cs-line cs-line3" aria-hidden="true"></span>
                        </div>
                    </button>
                    <div className="cs-ul-wrapper">
                        <ul id="cs-expanded" className="cs-ul" aria-expanded="false">
                            <li className="cs-li">
                                <a href="https://camillusdetails.online" className="cs-li-link cs-active">
                                    Home
                                </a>
                            </li>
                            <li className="cs-li">
                                <a href="https://camillusdetails.online/about-car-detailing-belfast.html" className="cs-li-link">
                                    About
                                </a>
                            </li>
                            <li className="cs-li cs-dropdown" tabIndex={0}>
                                <span className="cs-li-link">
                                    Services
                                    <img className="cs-drop-icon" src={caretDown} alt="dropdown icon"
                                        width="15" height="15" decoding="async" aria-hidden="true"/>
                                </span>
                                <ul className="cs-drop-ul">
                                    <li className="cs-drop-li">
                                        <a href="https://camillusdetails.online/services-interior-detail-car-valet-belfast.html"
                                            className="cs-li-link cs-drop-link">Interior Detail</a>
                                    </li>
                                    <li className="cs-drop-li">
                                        <a href="https://camillusdetails.online/services-exterior-detail-car-wash-belfast.html"
                                            className="cs-li-link cs-drop-link">Exterior Detail</a>
                                    </li>
                                    <li className="cs-drop-li">
                                        <a href="https://camillusdetails.online/services-full-detail-car-detailing-belfast.html"
                                            className="cs-li-link cs-drop-link">Full Detail</a>
                                    </li>
                                </ul>
                            </li>
                            <li className="cs-li">
                                <a href="https://camillusdetails.online/contact-camillus-details-belfast-car-wash.html" className="cs-li-link">
                                    Contact
                                </a>
                            </li>
                        </ul>
                    </div>
                </nav>
                <a href="https://www.tiktok.com/@camillus_codes" target="_blank" className="cs-button-solid cs-nav-button">Get a
                    Quote</a>
            </div>
        </header>
    )
}