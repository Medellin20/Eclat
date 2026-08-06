import Link from 'next/link';

export default function NonTrouve() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-5 text-center sm:px-8">
      <p className="eyebrow">Erreur 404</p>
      <h1 className="mt-4 font-display text-4xl leading-tight text-encre sm:text-5xl">
        Cette page n’existe pas
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-ardoise">
        Le lien est peut-être obsolète. Revenez à l’accueil pour retrouver le profil.
      </p>
      <Link href="/" className="btn-primaire mt-8">
        Retour à l’accueil
      </Link>
    </div>
  );
}
