<p align="center">
  <img src="docs/banner.png" alt="Bande de Rôlistes" />
</p>

Application web développée pour l’association **Bande de Rôlistes**, dédiée à la gestion et à l’évolution d’une plateforme communautaire autour du jeu de rôle.

Projet personnel conçu et maintenu par **Malky Dev**.

Le projet est actuellement en phase de développement et de stabilisation technique.

---

## 🧭 Objectif du projet

Ce dépôt sert de base technique pour une application web moderne permettant :

* la gestion d’utilisateurs
* l’authentification sécurisée
* l’administration des rôles
* l’intégration Discord
* une architecture backend/frontend fortement typée

L’accent est mis sur la **maintenabilité long terme**, la **sécurité** et la **cohérence de typage** plutôt que sur une mise en production rapide.

---

## 🧱 Stack Technique

### Backend

* Node.js
* Express
* Sequelize
* Authentification par cookie de session
* Protection CSRF
* Middleware RBAC (auth / admin)

### Frontend

* React
* Vite
* Fetch API native

### Typage & Qualité

* TypeScript strict (`strict: true`)
* ESLint type-aware
* Architecture sans `any` ni `unknown`
* Types API partagés backend/frontend

---

## 📁 Architecture Temporaire

```text
src/
├── client/
│   └── Application React (Vite)
│
├── server/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── models/
│   └── utils/
│
└── types/
    └── api/
        ├── auth.ts
        ├── session.ts
        ├── admin.ts
        └── errors.ts
```


---

## 🧠 Architecture TypeScript

Le projet suit une approche **API-first typée** :

* les types API sont centralisés dans `src/types/api`
* backend et frontend partagent exactement les mêmes contrats
* aucune divergence de payload possible au runtime

Exemple de pattern controller :

```ts
const controller: RequestHandler<
  Params,
  ResponseType,
  BodyType
> = async (req, res): Promise<void> => {
  try {
    res.json(payload)
  } catch {
    res.status(500).json(apiError)
  }
}
```

Principes appliqués :

* validation runtime minimale (`typeof`)
* guards TypeScript simples
* absence de validation runtime lourde
* typage explicite des réponses API

---

## ⚙️ Philosophie technique

Le projet privilégie :

* stabilité du runtime
* lisibilité du code
* factorisation des types
* contrôle explicite des entrées API
* réduction maximale des zones non typées

Choix assumés :

* pas de validation schema runtime lourde
* pas de sur-abstraction ORM
* logique explicite plutôt que magique

---

## 📌 État du projet

Projet en développement actif.

L’architecture et le typage sont actuellement en phase de consolidation afin d’obtenir :

* un backend entièrement compatible TypeScript strict
* zéro accès unsafe
* une base maintenable sur le long terme

---

## 👤 Auteur

**Malky Dev** 

[![LinkedIn](https://img.shields.io/badge/-LinkedIn-blue?style=flat-square&logo=Linkedin&logoColor=white)](https://www.linkedin.com/in/joseph-bensusan-12473b62/)

[![Known Vulnerabilities](https://snyk.io/test/github/Malky-dev/bande-de-rolistes/badge.svg)](https://snyk.io/test/github/Malky-dev/bande-de-rolistes)



Projet personnel développé pour l’association *Bande de Rôlistes*.
