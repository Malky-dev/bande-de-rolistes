# Configuration Discord OAuth

Ce guide explique comment configurer l'authentification Discord pour l'application Bande de Rôlistes.

## Étapes de configuration

### 1. Créer une application Discord

1. Rendez-vous sur [Discord Developer Portal](https://discord.com/developers/applications)
2. Cliquez sur **"New Application"**
3. Donnez un nom à votre application (ex: "Bande de Rôlistes")
4. Cliquez sur **"Create"**

### 2. Configurer OAuth2

1. Dans le menu de gauche, allez dans **"OAuth2"**
2. Notez votre **Client ID** et **Client Secret** (vous en aurez besoin)
3. Dans la section **"Redirects"**, ajoutez l'URL de callback :
   ```
   http://localhost:3000/api/discord/callback
   ```
   Pour la production, ajoutez également :
   ```
   https://votre-domaine.com/api/discord/callback
   ```

### 3. Configurer les variables d'environnement

1. Créez un fichier `.env` à la racine du projet en copiant `.env.example` :
   ```bash
   cp .env.example .env
   ```

2. Éditez le fichier `.env` et remplissez les valeurs :
   ```env
   DISCORD_CLIENT_ID=votre_client_id
   DISCORD_CLIENT_SECRET=votre_client_secret
   DISCORD_REDIRECT_URI=http://localhost:3000/api/discord/callback
   FRONTEND_URL=http://localhost:5173
   PORT=3000
   ```

⚠️ **Important** : Le fichier `.env` est ignoré par Git pour des raisons de sécurité. Ne commitez jamais ce fichier !

### 5. Mettre à jour la base de données

Le modèle `User` a été modifié pour inclure le champ `discordId`. Vous devez synchroniser la base de données :

```bash
# Option 1 : Utiliser Sequelize sync (déjà fait automatiquement au démarrage)
npm run dev:server

# Option 2 : Créer une migration manuelle si nécessaire
# Ajoutez la colonne discordId à la table User
```

### 4. Installer les dépendances

```bash
npm install
```

Cela installera `discord-oauth2` et `dotenv` qui sont nécessaires pour l'authentification Discord et la gestion des variables d'environnement.

### 6. Vérifier la configuration

Au démarrage du serveur, si les variables d'environnement Discord sont manquantes, le serveur s'arrêtera avec un message d'erreur explicite. Assurez-vous que toutes les variables sont bien configurées dans votre fichier `.env`.

### 7. Tester l'authentification

1. Démarrez le serveur backend :
   ```bash
   npm run dev:server
   ```

2. Démarrez le frontend :
   ```bash
   npm run dev
   ```

3. Allez sur la page de connexion/inscription
4. Cliquez sur **"Se connecter avec Discord"** ou **"S'inscrire avec Discord"**
5. Vous serez redirigé vers Discord pour autoriser l'application
6. Après autorisation, vous serez redirigé vers l'application et connecté automatiquement

## Fonctionnalités

- **Inscription automatique** : Si l'utilisateur n'existe pas, un compte est créé automatiquement avec :
  - Nickname : Le username Discord
  - Email : L'email Discord (si disponible)
  - Discord ID : L'ID unique Discord de l'utilisateur

- **Connexion automatique** : Si l'utilisateur existe déjà (par Discord ID ou email), il est connecté automatiquement

- **Liaison de compte** : Si un utilisateur existe avec le même email mais sans Discord ID, le compte est automatiquement lié

## Sécurité

- Les tokens Discord sont échangés uniquement côté serveur
- Les mots de passe pour les comptes Discord sont générés aléatoirement (l'utilisateur ne les connaît jamais)
- Les sessions sont gérées de la même manière que les connexions classiques

## Notes importantes

⚠️ **En production**, assurez-vous de :
- Utiliser HTTPS pour toutes les URLs
- Protéger votre Client Secret (ne jamais le commiter dans Git)
- Configurer correctement les Redirect URIs dans Discord
- Utiliser des variables d'environnement pour toutes les configurations sensibles
