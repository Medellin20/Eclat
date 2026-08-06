# Éclat

Plateforme de démonstration pour la réservation de séances de coaching et de bien-être.
Application Next.js complète, responsive et directement exécutable.

> **Nature du projet** — Éclat est une démonstration technique. Les paiements, les
> envois d'e-mails et les appels vidéo sont simulés. Aucune donnée bancaire n'est
> demandée, transmise ni conservée à aucun moment.

---

## Pile technique

| Domaine | Choix |
|---|---|
| Framework | Next.js 14 (App Router) |
| Langage | TypeScript (mode strict) |
| UI | React 18 + Tailwind CSS 3 |
| Icônes | lucide-react |
| Données & stockage | Supabase (optionnel) + repli localStorage |
| E-mail serveur | Nodemailer |
| Déploiement | Netlify |
| Gestionnaire de paquets | npm |

---

## Démarrage

```bash
npm install
cp .env.example .env.local   # facultatif : l'app fonctionne sans
npm run dev
```

Ouvrez http://localhost:3000

L'application démarre avec six profils de démonstration et fonctionne
**entièrement hors ligne** : sans variables Supabase, tout est conservé dans le
localStorage du navigateur.

### Scripts

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run start` | Sert le build de production |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

---

## Pages

| Route | Rôle |
|---|---|
| `/` | Accueil : présentation, recherche, grille de profils |
| `/coach/[id]` | Profil : photo, note, description, galeries photo et vidéo |
| `/bookings` | Formulaire de réservation avec récapitulatif de prix en direct |
| `/bookings-history` | Historique des réservations (état vide inclus) |
| `/video-call` | Salle d'appel simulée : minuteur, micro, caméra, raccrochage |
| `/admin` | Connexion de démonstration + tableau de bord |
| `/api/notify-payment` | Route POST de notification (Nodemailer) |

**Accès administration :** mot de passe `eclat2026` — voir l'avertissement de sécurité plus bas.

---

## Architecture

```
app/
  layout.tsx                    Provider, en-tête, pied de page, métadonnées
  page.tsx                      Accueil (composant serveur)
  globals.css                   Tokens, grain, focus, prefers-reduced-motion
  not-found.tsx                 Page 404
  coach/[id]/page.tsx           Profil (generateStaticParams + generateMetadata)
  bookings/page.tsx             Réservation (Suspense → BookingForm)
  bookings-history/page.tsx     Historique
  video-call/page.tsx           Appel vidéo (Suspense → VideoCall)
  admin/page.tsx                Administration
  api/notify-payment/route.ts   API POST, runtime Node.js

src/
  components/    Header, Footer, CoachCard, CoachGrid, CoachDetail,
                 MediaGallery, Lightbox, UnlockModal, BookingForm,
                 BookingHistory, VideoCall, AdminPanel, CoachEditor,
                 Stars, Etats
  context/       AppContext.tsx
  data/          seed.ts
  lib/           supabase.ts, persistence.ts, format.ts
  types/         index.ts

public/media/    36 images + 12 vidéos de démonstration
```

Les composants sont **serveur par défaut**. La directive `"use client"` n'est
présente que sur les composants qui utilisent des hooks, le contexte, le
localStorage ou des API navigateur. La navigation passe exclusivement par
`next/link` et `next/navigation` — aucun React Router.

---

## Modèle de données

Quatre entités, définies dans `src/types/index.ts` :

- **`Coach`** — profil : nom, âge, localisation, accroche, description, spécialités, tarif horaire, note, photo principale, médias
- **`Media`** — photo ou vidéo, avec indicateur `locked` et prix en crédits
- **`Booking`** — réservation : praticien, date, heure, durée, format, coordonnées client, total, statut
- **`Purchase`** — déblocage simulé : média, montant, référence fictive locale

Le `AppContext` (`src/context/AppContext.tsx`) expose la lecture, la création,
la modification et la suppression des profils, la gestion des médias, les
réservations et les déblocages.

### Persistance

1. Si `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` sont définies,
   l'état est lu et écrit dans la table `app_state`.
2. Sinon — ou en cas d'échec réseau — repli automatique sur `localStorage`.

Table à créer dans Supabase :

```sql
create table if not exists public.app_state (
  id         text primary key,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

-- Démonstration uniquement. En production, restreignez l'écriture
-- aux comptes authentifiés portant un rôle « admin ».
create policy "lecture publique"  on public.app_state for select using (true);
create policy "ecriture publique" on public.app_state for all    using (true) with check (true);
```

Créez également un bucket de stockage public nommé `media` si vous souhaitez
héberger vos propres photos et vidéos.

---

## Variables d'environnement

```bash
# Publiques (exposées au navigateur)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=media

# Serveur uniquement — JAMAIS de préfixe NEXT_PUBLIC_
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=
EMAIL_PASS=
NOTIFY_TO=
```

`EMAIL_PASS` est un secret serveur. Le préfixer par `NEXT_PUBLIC_` l'exposerait
dans le bundle JavaScript envoyé à chaque visiteur.

---

## Route API `POST /api/notify-payment`

Runtime Node.js. Envoie une notification interne lors d'un déblocage simulé.

**Corps attendu**

```json
{
  "mediaId": "camille-v2",
  "mediaTitle": "Séquence complète 30 min",
  "coachName": "Camille Rousseau",
  "amount": 60
}
```

**Réponses**

| Code | Situation |
|---|---|
| `200` | Notification envoyée |
| `202` | Requête valide, SMTP non configuré (la démo continue) |
| `400` | JSON invalide ou champs métier manquants |
| `405` | Méthode autre que POST |
| `415` | `Content-Type` différent de `application/json` |
| `422` | Le corps contient un champ de paiement interdit |
| `502` | Échec SMTP (le détail n'est jamais renvoyé au client) |

La route inspecte le corps **récursivement** et rejette toute clé évoquant une
donnée de paiement : `card`, `cvv`, `iban`, `giftcode`, `voucher`, `pin`,
`accountNumber`, `seedPhrase`, etc.

Vérification rapide :

```bash
# 202 — valide, sans SMTP
curl -X POST http://localhost:3000/api/notify-payment \
  -H 'Content-Type: application/json' \
  -d '{"mediaId":"x","mediaTitle":"t","coachName":"c","amount":25}'

# 422 — rejeté
curl -X POST http://localhost:3000/api/notify-payment \
  -H 'Content-Type: application/json' \
  -d '{"mediaId":"x","mediaTitle":"t","coachName":"c","amount":25,"cardNumber":"4111"}'
```

---

## Sécurité — à lire avant toute mise en production

### Authentification administrateur

L'écran `/admin` compare un mot de passe **écrit en clair dans le code client**
(`src/components/AdminPanel.tsx`). N'importe qui peut le lire dans le bundle
JavaScript. Cela n'offre **aucune sécurité réelle** et ne convient qu'à une
démonstration.

Pour une vraie mise en production :

1. Remplacer le formulaire par `supabase.auth.signInWithPassword()`.
2. Protéger les routes d'administration via un middleware Next.js qui vérifie la session.
3. Activer Row Level Security sur `app_state` et n'autoriser l'écriture qu'au rôle « admin ».

Sans RLS, la clé anonyme publique permet à quiconque d'écrire dans la base.

### Paiements

Le déblocage de contenu est une **simulation intégrale**. Aucun champ ne collecte
de numéro de carte, de cryptogramme, de code de carte cadeau ou d'IBAN.

Pour accepter de vrais paiements, passez par un prestataire certifié PCI-DSS
(Stripe Checkout, par exemple) : votre code ne doit jamais voir les données
bancaires, et votre serveur ne doit jamais les stocker.

### Appel vidéo

`/video-call` est une interface simulée. Aucune caméra ni aucun micro n'est
activé, aucun service de visioconférence externe n'est appelé, rien n'est
enregistré.

---

## Médias de démonstration

Les 36 images et 12 vidéos de `public/media/` ont été générées spécifiquement
pour ce projet : dégradés abstraits originaux et animations de zoom lent.
Elles sont **libres d'usage**, sans dépendance réseau et sans contenu explicite.

Pour utiliser vos propres fichiers : déposez-les dans `public/media/`, ou
téléversez-les dans votre bucket Supabase et collez l'URL publique dans
l'éditeur de profil de l'administration.

---

## Accessibilité

- Lien d'évitement vers le contenu principal
- Focus clavier visible sur tous les éléments interactifs
- `aria-label`, `aria-current`, `aria-invalid`, `aria-describedby`, `aria-live` là où c'est utile
- Visionneuse fermée par <kbd>Échap</kbd>, navigation aux flèches
- États de chargement annoncés (`role="status"`), erreurs annoncées (`role="alert"`)
- `prefers-reduced-motion` respecté
- États vides rédigés comme des invitations à agir

---

## Contrôles effectués

```
npm install      ✓
npm run lint     ✓  aucun avertissement
npm run typecheck ✓  aucune erreur
npm run build    ✓  14 pages générées
```

Toutes les routes répondent `200` en production ; l'API a été vérifiée sur les
cas `200`, `202`, `400`, `405` et `422`.
