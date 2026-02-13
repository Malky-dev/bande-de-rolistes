# Code Review - Bande de Rôlistes

## Résumé des problèmes

| Criticité | Nombre | Statut |
|-----------|--------|--------|
| ERROR | 10 | ❌ |
| WARNING | 6 | ⚠️ |
| PERF | 5 | ⚠️ |
| TYPING | 3 | ⚠️ |
| OTHER | 6 | ⚠️ |

---

## 🔴 ERROR - Problèmes de sécurité critiques

### ERROR-1: Utilisation de SHA-256 pour le hachage des mots de passe
**Fichier:** `global.js:5-7`, `controllers/signin.js:27`, `controllers/login.js:20`

**Problème:** SHA-256 est une fonction de hachage rapide, non adaptée aux mots de passe. Elle est vulnérable aux attaques par force brute et aux tables arc-en-ciel.

**Suggestion:**
```javascript
// Utiliser bcrypt ou argon2
const bcrypt = require('bcrypt');
const saltRounds = 12;

// Au signup
const hashedPassword = await bcrypt.hash(password, saltRounds);

// Au login
const isValid = await bcrypt.compare(password, user.password);
```

**Alternative:** Utiliser `argon2` avec `argon2.hash()` et `argon2.verify()`.

---

### ERROR-2: Identifiants de base de données en dur dans le code
**Fichier:** `db.js:6`

**Problème:** Les identifiants de base de données sont codés en dur (`'root'`, `'password'`), ce qui expose les credentials en cas de fuite du code source.

**Suggestion:**
```javascript
const sequelize = new Sequelize(
  process.env.DB_NAME || 'bande_de_rolistes',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    // ...
  }
)
```

**Alternative:** Utiliser un gestionnaire de secrets (AWS Secrets Manager, HashiCorp Vault) en production.

---

### ERROR-3: Token d'authentification exposé dans l'URL
**Fichier:** `src/authApi.ts:104`, `src/authApi.ts:125`, `src/authApi.ts:145`, `controllers/discord.js:130`

**Problème:** Les tokens sont passés en paramètre d'URL (`?token=...`), ce qui les expose dans les logs serveur, l'historique du navigateur, et les référents HTTP.

**Suggestion:**
```typescript
// Utiliser uniquement les headers Authorization et les cookies
const res = await fetch(`${API_BASE}/admin/users`, {
  headers: {
    ...getAuthHeaders(),
    Authorization: `Bearer ${token}`, // Pas dans l'URL
  },
  credentials: 'include',
})
```

**Alternative:** Utiliser uniquement les cookies httpOnly pour l'authentification, sans token dans l'URL.

---

### ERROR-4: Vérification d'expiration de session manquante
**Fichier:** `controllers/session.js:11-21`

**Problème:** Le contrôleur de session ne vérifie pas si la session est expirée avant de retourner les informations utilisateur.

**Suggestion:**
```javascript
const session = await Session.findOne({
  where: { 
    token,
    expiration: {
      [Op.gt]: new Date(), // Vérifier l'expiration
    },
  },
  include: {
    model: User,
    required: true,
    include: {
      model: Role,
      required: true,
    },
  },
})
```

**Alternative:** Ajouter un middleware global qui vérifie l'expiration avant chaque requête authentifiée.

---

### ERROR-5: Absence de rate limiting
**Fichier:** `server.js` (global)

**Problème:** Aucune protection contre les attaques par force brute sur les endpoints de login/signin.

**Suggestion:**
```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives max
  message: 'Trop de tentatives de connexion, réessayez plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.post('/api/login', loginLimiter, loginController);
app.post('/api/signin', loginLimiter, signinController);
```

**Alternative:** Utiliser `express-slow-down` pour ralentir progressivement les requêtes.

---

### ERROR-6: Cookie sans flag `secure` en production
**Fichier:** `controllers/login.js:42-45`, `controllers/discord.js:124-127`

**Problème:** Les cookies ne sont pas marqués comme `secure`, ce qui permet leur transmission en HTTP non sécurisé.

**Suggestion:**
```javascript
res.cookie('bande_de_rolistes', token, {
  maxAge: 1000 * 60 * 60 * 24 * 30,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // HTTPS uniquement en prod
  sameSite: 'strict', // Protection CSRF
})
```

**Alternative:** Toujours utiliser `secure: true` et forcer HTTPS en production.

---

### ERROR-7: Messages d'erreur exposant des détails internes
**Fichier:** `controllers/*.js` (multiple fichiers)

**Problème:** Les messages d'erreur (`error.message`) peuvent révéler des informations sensibles sur la structure de la base de données ou le code.

**Suggestion:**
```javascript
catch (error) {
  console.error('Erreur interne:', error) // Log complet côté serveur
  const message = process.env.NODE_ENV === 'production' 
    ? 'Une erreur est survenue' 
    : error.message // Détails uniquement en dev
  res.status(500).json({ code: 'ERROR', message })
}
```

**Alternative:** Utiliser des codes d'erreur standardisés et mapper les messages côté client.

---

### ERROR-8: Absence de validation du format email
**Fichier:** `controllers/signin.js:11-12`, `controllers/login.js:10-11`

**Problème:** Seule la présence d'une chaîne est vérifiée, pas le format de l'email, ce qui peut permettre des emails invalides.

**Suggestion:**
```javascript
const validator = require('validator');

if (!validator.isEmail(email)) {
  return res.status(400).json({ 
    code: 'BAD_REQUEST', 
    message: 'Format email invalide' 
  })
}
```

**Alternative:** Utiliser une regex ou une bibliothèque comme `joi` pour la validation complète.

---

### ERROR-9: Absence de protection CSRF
**Fichier:** `server.js` (global)

**Problème:** Aucune protection CSRF pour les requêtes modifiant l'état (POST, PUT, DELETE).

**Suggestion:**
```javascript
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

app.use(csrfProtection);

// Pour les routes nécessitant CSRF
app.post('/api/signin', csrfProtection, signinController);
app.put('/api/admin/users/:userID/role', csrfProtection, adminUpdateRoleController);
```

**Alternative:** Utiliser le flag `sameSite: 'strict'` sur les cookies (déjà suggéré dans ERROR-6).

---

### ERROR-10: Génération de token prévisible
**Fichier:** `controllers/login.js:28`, `controllers/discord.js:109`

**Problème:** Le token est généré avec `encryptSHA256(email + formatDate(new Date()))`, ce qui est prévisible et peut être deviné.

**Suggestion:**
```javascript
const crypto = require('crypto');

const token = crypto.randomBytes(32).toString('hex');
// Ou utiliser une bibliothèque dédiée
const { randomBytes } = require('crypto');
const token = randomBytes(32).toString('hex');
```

**Alternative:** Utiliser `uuid` ou `nanoid` pour générer des tokens uniques et non prévisibles.

---

## ⚠️ WARNING - Problèmes de sécurité non critiques

### WARNING-1: Logs contenant des informations sensibles
**Fichier:** `middleware/authAdmin.js:17-22`, `src/components/AdminPanel.tsx:22-24`

**Problème:** Les logs console peuvent exposer des tokens, cookies, et informations utilisateur sensibles.

**Suggestion:**
```javascript
// Ne pas logger les tokens complets
console.log('❌ Admin middleware: Token manquant', {
  hasToken: !!token,
  tokenLength: token?.length,
  // Ne pas logger: cookies, authHeader, etc.
})
```

**Alternative:** Utiliser un système de logging avec niveaux (winston, pino) et masquer les données sensibles automatiquement.

---

### WARNING-2: Absence d'enforcement HTTPS
**Fichier:** `server.js` (global)

**Problème:** Aucune redirection HTTP vers HTTPS ni vérification de l'environnement de production.

**Suggestion:**
```javascript
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

**Alternative:** Configurer HTTPS au niveau du reverse proxy (nginx, Apache).

---

### WARNING-3: Configuration CORS potentiellement permissive
**Fichier:** `server.js:26-29`

**Problème:** La configuration CORS dépend d'une variable d'environnement qui pourrait être mal configurée, permettant des requêtes depuis n'importe quelle origine.

**Suggestion:**
```javascript
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',');

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
```

**Alternative:** Utiliser une whitelist stricte d'origines autorisées.

---

### WARNING-4: Absence de validation de la force du mot de passe
**Fichier:** `controllers/signin.js:14-16`

**Problème:** Aucune exigence de complexité pour les mots de passe, permettant des mots de passe faibles.

**Suggestion:**
```javascript
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

if (!passwordRegex.test(password)) {
  return res.status(400).json({ 
    code: 'BAD_REQUEST', 
    message: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial' 
  });
}
```

**Alternative:** Utiliser `zod` ou `joi` pour une validation plus robuste.

---

### WARNING-5: Absence de verrouillage de compte après échecs
**Fichier:** `controllers/login.js` (global)

**Problème:** Aucun mécanisme pour bloquer temporairement un compte après plusieurs tentatives de connexion échouées.

**Suggestion:**
```javascript
// Ajouter un champ failedLoginAttempts et lockUntil dans le modèle User
// Dans le contrôleur login:
if (user.lockUntil && user.lockUntil > Date.now()) {
  return res.status(423).json({ 
    code: 'LOCKED', 
    message: 'Compte temporairement verrouillé' 
  });
}

if (!user) {
  // Incrémenter les tentatives échouées
  await incrementFailedLoginAttempts(email);
  return res.status(404).json({ code: 'NOT_FOUND', message: 'User not available' });
}
```

**Alternative:** Utiliser un système de rate limiting par email au lieu de verrouillage de compte.

---

### WARNING-6: Vérification d'expiration manquante dans session controller
**Fichier:** `controllers/session.js:11-21`

**Problème:** Le contrôleur de session ne vérifie pas l'expiration (déjà mentionné dans ERROR-4, mais c'est aussi un warning car moins critique que l'authentification admin).

**Suggestion:** Voir ERROR-4.

---

## ⚡ PERF - Problèmes de performance

### PERF-1: Absence de pagination pour la liste des utilisateurs
**Fichier:** `controllers/admin/users.js:8-14`

**Problème:** Tous les utilisateurs sont chargés en mémoire sans pagination, ce qui peut causer des problèmes de performance avec un grand nombre d'utilisateurs.

**Suggestion:**
```javascript
const { page = 1, limit = 50 } = req.query;
const offset = (parseInt(page) - 1) * parseInt(limit);

const { count, rows: users } = await User.findAndCountAll({
  include: {
    model: Role,
    required: true,
  },
  order: [['nickname', 'ASC']],
  limit: parseInt(limit),
  offset: offset,
});

res.json({
  users: users.map(user => ({ /* ... */ })),
  pagination: {
    total: count,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(count / parseInt(limit)),
  },
});
```

**Alternative:** Implémenter un système de curseur pour la pagination (plus efficace pour de grandes listes).

---

### PERF-2: Instanciation de DeviceDetector à chaque requête
**Fichier:** `controllers/login.js:30`, `controllers/discord.js:111`

**Problème:** `DeviceDetector` est instancié à chaque requête, ce qui est inefficace.

**Suggestion:**
```javascript
// Au niveau du module
const DeviceDetector = require('device-detector-js');
const deviceDetector = new DeviceDetector();

// Dans le contrôleur
const device = deviceDetector.parse(userAgent) || {};
```

**Alternative:** Utiliser un singleton ou un pool d'instances réutilisables.

---

### PERF-3: Utilisation de sequelize.sync() en production
**Fichier:** `server.js:41`

**Problème:** `sequelize.sync()` modifie automatiquement le schéma de la base de données, ce qui est dangereux en production et peut causer des pertes de données.

**Suggestion:**
```javascript
async function initDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion Sequelize OK à bande_de_rolistes');
    
    // Ne pas utiliser sync() en production
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync();
      console.log('✅ Modèles synchronisés');
    } else {
      console.log('ℹ️ Mode production: synchronisation désactivée');
    }
  } catch (error) {
    console.error('❌ Erreur d\'initialisation de la base :', error);
  }
}
```

**Alternative:** Utiliser des migrations Sequelize (`sequelize-cli`) pour gérer les changements de schéma.

---

### PERF-4: Absence de cache pour les rôles
**Fichier:** `controllers/admin/roles.js:6-12`

**Problème:** Les rôles sont récupérés depuis la base de données à chaque requête, alors qu'ils changent rarement.

**Suggestion:**
```javascript
const NodeCache = require('node-cache');
const roleCache = new NodeCache({ stdTTL: 3600 }); // Cache 1 heure

module.exports = async function controllerAdminRoles(req, res) {
  try {
    let roles = roleCache.get('roles');
    
    if (!roles) {
      roles = await Role.findAll({
        order: [['roleID', 'ASC']],
      });
      roleCache.set('roles', roles);
    }
    
    res.json(roles.map(role => ({
      roleID: role.roleID,
      roleLabel: role.roleLabel,
    })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 'ERROR', message: error.message });
  }
};
```

**Alternative:** Utiliser Redis pour un cache distribué en cas de déploiement multi-instances.

---

### PERF-5: Requête supplémentaire inutile dans updateRole
**Fichier:** `controllers/admin/updateRole.js:47-53`

**Problème:** Après la mise à jour, une requête supplémentaire est effectuée pour récupérer l'utilisateur avec le rôle, alors que `user.reload()` avec include serait plus efficace.

**Suggestion:**
```javascript
// Mettre à jour le rôle
await user.update({ roleID });

// Recharger avec les relations
await user.reload({
  include: {
    model: Role,
    required: true,
  },
});

res.json({
  userID: user.userID,
  nickname: user.nickname,
  email: user.email,
  roleID: user.roleID,
  roleLabel: user.Role?.roleLabel || 'member',
  isVerified: user.isVerified,
});
```

**Alternative:** Utiliser `user.setRole(role)` si Sequelize le supporte, ou retourner directement les données mises à jour sans requête supplémentaire.

---

## 📝 TYPING - Problèmes de typage

### TYPING-1: Absence de validation de type pour userID et roleID
**Fichier:** `controllers/admin/updateRole.js:8-9`

**Problème:** `userID` et `roleID` sont extraits des paramètres/body sans validation de type, ce qui peut permettre des valeurs non numériques.

**Suggestion:**
```javascript
const { userID } = req.params;
const { roleID } = req.body;

const userIdNum = parseInt(userID, 10);
const roleIdNum = parseInt(roleID, 10);

if (isNaN(userIdNum) || isNaN(roleIdNum)) {
  return res.status(400).json({ 
    code: 'BAD_REQUEST', 
    message: 'userID and roleID must be valid numbers' 
  });
}
```

**Alternative:** Utiliser `joi` ou `zod` pour une validation de schéma complète.

---

### TYPING-2: Absence de TypeScript sur le backend
**Fichier:** Tous les fichiers `.js` du backend

**Problème:** Le backend est en JavaScript pur, ce qui empêche la détection d'erreurs de type à la compilation.

**Suggestion:**
- Migrer progressivement vers TypeScript
- Ajouter des annotations JSDoc pour améliorer l'autocomplétion et la détection d'erreurs

**Alternative:** Utiliser `@ts-check` en haut des fichiers JavaScript pour activer la vérification de type basique.

---

### TYPING-3: Types manquants dans les réponses API
**Fichier:** `controllers/*.js` (multiple fichiers)

**Problème:** Les réponses JSON n'ont pas de schéma défini, ce qui peut causer des incohérences entre le frontend et le backend.

**Suggestion:**
```javascript
// Utiliser JSDoc pour documenter les types
/**
 * @typedef {Object} UserResponse
 * @property {number} userID
 * @property {string} nickname
 * @property {string} email
 * @property {number} roleID
 * @property {string} roleLabel
 * @property {boolean} isVerified
 */

/**
 * @param {import('express').Request} req
 * @param {import('express').Response<UserResponse[]>} res
 */
```

**Alternative:** Utiliser `swagger` ou `openapi` pour documenter et valider les schémas d'API.

---

## 🔧 OTHER - Autres problèmes d'optimisation

### OTHER-1: Gestion d'erreur incohérente
**Fichier:** Tous les contrôleurs

**Problème:** Les codes de statut HTTP et les codes d'erreur personnalisés sont incohérents (404 pour "User not available", 500 pour "DUPLICATE").

**Suggestion:**
```javascript
// Standardiser les codes
if (!user) {
  return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
}

if (existing) {
  return res.status(409).json({ code: 'CONFLICT', message: 'User already exists' });
}
```

**Alternative:** Créer une classe d'erreur personnalisée avec mapping automatique vers les codes HTTP.

---

### OTHER-2: Nombres magiques dans le code
**Fichier:** `controllers/signin.js:28`, `controllers/discord.js:102`

**Problème:** `roleID: 5` est codé en dur sans constante explicite.

**Suggestion:**
```javascript
// Créer un fichier constants.js
const ROLES = {
  ADMIN: 1,
  ORGANISATOR: 2,
  DUNGEON_MASTER: 3,
  MEMBER: 4,
  GUEST: 5,
};

// Utilisation
await User.create({
  // ...
  roleID: ROLES.GUEST,
});
```

**Alternative:** Utiliser une table de lookup ou une énumération Sequelize.

---

### OTHER-3: URL API en dur dans le frontend
**Fichier:** `src/authApi.ts:7`

**Problème:** L'URL de l'API est codée en dur, ce qui complique le déploiement dans différents environnements.

**Suggestion:**
```typescript
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';
```

**Alternative:** Utiliser un fichier de configuration par environnement.

---

### OTHER-4: Absence de validation des variables d'environnement
**Fichier:** `server.js:4`, `controllers/discord.js:14-22`

**Problème:** Les variables d'environnement ne sont pas validées au démarrage, ce qui peut causer des erreurs en production.

**Suggestion:**
```javascript
const requiredEnvVars = ['DB_PASSWORD', 'DISCORD_CLIENT_SECRET', 'FRONTEND_URL'];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(`❌ Variable d'environnement manquante: ${envVar}`);
    process.exit(1);
  }
});
```

**Alternative:** Utiliser `dotenv-safe` ou `envalid` pour valider automatiquement les variables d'environnement.

---

### OTHER-5: Code dupliqué pour la gestion des tokens
**Fichier:** `src/authApi.ts:96-157`

**Problème:** La logique de récupération et d'encodage du token est dupliquée dans plusieurs fonctions.

**Suggestion:**
```typescript
function getToken(): string {
  const token = localStorage.getItem('bdr_token');
  if (!token) {
    throw new Error('Token manquant. Veuillez vous reconnecter.');
  }
  return token;
}

function getAuthHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

async function apiAdminUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE}/admin/users`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  // ...
}
```

**Alternative:** Créer une fonction utilitaire `fetchWithAuth()` qui gère automatiquement l'authentification.

---

### OTHER-6: Absence de tests
**Fichier:** Projet global

**Problème:** Aucun test unitaire ou d'intégration n'est présent pour valider le comportement du code.

**Suggestion:**
- Ajouter Jest pour les tests unitaires
- Ajouter Supertest pour les tests d'API
- Configurer un pipeline CI/CD pour exécuter les tests automatiquement

**Alternative:** Commencer par des tests critiques (authentification, autorisation admin) avant d'étendre à toute l'application.

---

## Conclusion

Le projet présente **10 problèmes de sécurité critiques** qui nécessitent une attention immédiate, notamment :
- Le remplacement de SHA-256 par bcrypt/argon2 pour le hachage des mots de passe
- La sécurisation des tokens (ne plus les exposer dans les URLs)
- L'ajout de rate limiting et de protection CSRF
- La validation stricte des entrées utilisateur

Les **6 problèmes de sécurité non critiques** et les **5 problèmes de performance** peuvent être traités progressivement, mais ils contribuent significativement à la robustesse et à l'efficacité de l'application.

Les problèmes de typage et d'optimisation générale, bien que moins urgents, amélioreront la maintenabilité et la qualité du code à long terme.

**Priorité recommandée :**
1. Corriger tous les problèmes ERROR
2. Implémenter les WARNING de sécurité
3. Optimiser les problèmes PERF les plus impactants
4. Améliorer le typage progressivement
5. Traiter les optimisations OTHER
