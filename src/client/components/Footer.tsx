import { useEffect, useState } from "react";
import { apiQuote, type Quote } from "../../api/authApi";
import type { View } from "@/types/navigation";

type FooterProps = {
  onChangeView: (view: View) => void;
};

function Footer({ onChangeView }: FooterProps) {
  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiQuote()
      .then((q) => {
        if (!cancelled) setQuote(q);
      })
      .catch(() => {
        if (!cancelled) setQuote(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <footer className="footer">
      <span className="footer-left">©Malky Dev - 2026</span>

      <span className="footer-center">
        <button
          className={`navbar-link navbar-link-button`}
          onClick={() => onChangeView("rules")}
        >
          Statuts et règlement intérieur
        </button>
      </span>

      <span className="footer-right">
        {quote ? (
          <>
            « {quote.content} »{quote.author ? ` — ${quote.author}` : ""}
          </>
        ) : (
          <>« Tout ça n'est qu'une farce. » — le Comédien</>
        )}
      </span>
    </footer>
  );
}

export default Footer;
