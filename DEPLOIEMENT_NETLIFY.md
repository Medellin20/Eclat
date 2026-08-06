# Déploiement sur Netlify

Ce guide couvre les deux méthodes : interface web (recommandée) et ligne de commande.

---

## Avant de commencer

Vérifiez que le projet se construit localement :

```bash
npm install
npm run typecheck
npm run build
```

Les trois commandes doivent se terminer sans erreur.

---

## Méthode 1 — Interface web (recommandée)

### 1. Publier le code sur Git

```bash
git init
git add .
git commit -m "Éclat — version initiale"
git branch -M main
git remote add origin https://github.com/VOTRE-COMPTE/eclat.git
git push -u origin main
```

Le `.gitignore` exclut déjà `node_modules/`, `.next/` et les fichiers `.env*`.
**Ne committez jamais `.env.local`.**

### 2. Créer le site

1. Ouvrez https://app.netlify.com
2. **Add new site → Import an existing project**
3. Choisissez votre fournisseur Git, puis le dépôt `eclat`

### 3. Paramètres de build

Netlify les détecte automatiquement depuis `netlify.toml`. Vérifiez :

| Champ | Valeur |
|---|---|
| Build command | `npm run build` |
| Publish directory | `.next` |
| Node version | `22` |

Le fichier `netlify.toml` déclare aussi le plugin officiel :

```toml
[[plugins]]
  package = "@netlify/plugin-nextjs"
```

Ce plugin est indispensable : il prend en charge l'App Router, les routes API et
le rendu à la demande. Netlify l'installe automatiquement.

### 4. Variables d'environnement

**Site configuration → Environment variables → Add a variable**

Ajoutez uniquement celles dont vous avez besoin :

| Nom | Portée | Obligatoire |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Navigateur | Non |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Navigateur | Non |
| `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` | Navigateur | Non (défaut : `media`) |
| `EMAIL_HOST` | Serveur | Non (défaut : `smtp.gmail.com`) |
| `EMAIL_PORT` | Serveur | Non (défaut : `465`) |
| `EMAIL_USER` | Serveur | Non |
| `EMAIL_PASS` | Serveur | Non |
| `NOTIFY_TO` | Serveur | Non |

L'application se déploie et fonctionne **sans aucune de ces variables** : elle
bascule alors sur le localStorage, et l'API renvoie `202` au lieu d'envoyer un e-mail.

> **`EMAIL_PASS` ne doit jamais être préfixé par `NEXT_PUBLIC_`.** Toute variable
> portant ce préfixe est intégrée au bundle JavaScript et devient lisible par
> n'importe quel visiteur.

Après avoir ajouté ou modifié une variable, relancez un déploiement :
**Deploys → Trigger deploy → Deploy site**.

### 5. Déployer

Cliquez sur **Deploy site**. Le premier build prend deux à trois minutes.
Chaque `git push` sur `main` déclenche ensuite un nouveau déploiement.

---

## Méthode 2 — Netlify CLI

```bash
npm install -g netlify-cli
netlify login

# Depuis la racine du projet
netlify init          # créer et relier un nouveau site
# ou
netlify link          # relier à un site existant

# Variables d'environnement
netlify env:set NEXT_PUBLIC_SUPABASE_URL "https://xxxx.supabase.co"
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "votre-cle-anon"
netlify env:set EMAIL_USER "vous@exemple.com"
netlify env:set EMAIL_PASS "votre-mot-de-passe-application"
netlify env:set NOTIFY_TO "destinataire@exemple.com"

# Aperçu, puis production
netlify deploy
netlify deploy --prod
```

---

## Configuration Supabase (facultatif)

Sans Supabase, l'application conserve les données dans le navigateur de chaque
visiteur. Pour les partager entre appareils :

### 1. Créer la table

**SQL Editor** dans le tableau de bord Supabase :

```sql
create table if not exists public.app_state (
  id         text primary key,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

-- Démonstration uniquement : ouvre l'écriture à tous.
create policy "lecture publique"  on public.app_state for select using (true);
create policy "ecriture publique" on public.app_state for all    using (true) with check (true);
```

En production, remplacez la politique d'écriture par une règle restreinte aux
comptes authentifiés portant un rôle « admin ».

### 2. Créer le bucket

**Storage → New bucket** → nom `media` → cochez **Public bucket**.

### 3. Récupérer les clés

**Project Settings → API** : copiez *Project URL* et la clé *anon public* dans
les variables Netlify correspondantes.

---

## Configuration SMTP (facultatif)

Nécessaire uniquement pour que `/api/notify-payment` envoie réellement un e-mail.

**Avec Gmail :** activez la validation en deux étapes, puis créez un
*mot de passe d'application* (Compte Google → Sécurité). Utilisez ce mot de passe
comme `EMAIL_PASS`, jamais votre mot de passe principal.

| Variable | Exemple |
|---|---|
| `EMAIL_HOST` | `smtp.gmail.com` |
| `EMAIL_PORT` | `465` |
| `EMAIL_USER` | `vous@gmail.com` |
| `EMAIL_PASS` | mot de passe d'application (16 caractères) |
| `NOTIFY_TO` | `destinataire@exemple.com` |

Sans ces variables, la route répond `202` avec `delivered: false` — la
démonstration continue de fonctionner normalement.

---

## Vérifications après déploiement

1. La page d'accueil affiche les six profils.
2. `/coach/camille` s'ouvre ; un média verrouillé déclenche la modale de déblocage.
3. Une réservation apparaît dans `/bookings-history`.
4. `/admin` accepte le mot de passe `eclat2026`.
5. L'API rejette bien les données de paiement :

```bash
curl -X POST https://VOTRE-SITE.netlify.app/api/notify-payment \
  -H 'Content-Type: application/json' \
  -d '{"mediaId":"x","mediaTitle":"t","coachName":"c","amount":25,"cardNumber":"4111"}'
# → 422
```

---

## Résolution des problèmes courants

**Le build échoue sur la version de Node**
Vérifiez `NODE_VERSION = "22"` dans `[build.environment]` du `netlify.toml`.

**Les routes API renvoient 404**
Le plugin `@netlify/plugin-nextjs` n'est pas actif. Vérifiez le bloc `[[plugins]]`
et relancez un déploiement complet (**Clear cache and deploy site**).

**Les images ne s'affichent pas**
Si vos images viennent de Supabase Storage, ajoutez le domaine dans
`images.remotePatterns` de `next.config.mjs`. Le motif `**.supabase.co` y est
déjà présent.

**Les données ne sont pas partagées entre appareils**
Supabase n'est pas configuré, ou la table `app_state` est absente, ou les
politiques RLS bloquent l'écriture.

**Une variable d'environnement semble ignorée**
Les variables sont lues au moment du build. Après modification, relancez un
déploiement.

---

## Rappel avant une mise en production réelle

- Remplacer l'authentification locale de `/admin` par Supabase Auth + middleware.
- Restreindre les politiques RLS de `app_state`.
- Confier tout paiement à un prestataire certifié PCI-DSS.
- Remplacer les visuels de démonstration par vos propres médias.
