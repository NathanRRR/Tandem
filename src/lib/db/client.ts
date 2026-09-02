import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

// Pas de validation au chargement du module : l'étape de build Next.js importe ce fichier
// sans .env réel (build image Docker). mysql2 échoue à la première requête réelle si
// l'URL est absente/invalide — au runtime, jamais au build.
// timezone: "Z" — tout le code applicatif construit des Date en UTC (voir lib/domain/month.ts).
// Sans ce réglage, mysql2 sérialise les paramètres Date en heure locale du serveur, ce qui décale
// les comparaisons sur les colonnes DATE d'un delta = fuseau horaire (bug silencieux, pas d'erreur).
const pool = mysql.createPool({ uri: process.env.DATABASE_URL ?? "", timezone: "Z" });

export const db = drizzle(pool, { schema, mode: "default" });
