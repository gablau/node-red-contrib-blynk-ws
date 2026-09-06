import js from "@eslint/js";
import json from "@eslint/json";
import globals from "globals";
import html from "@html-eslint/eslint-plugin";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
    globalIgnores(["cert/*", "coverage/*", "docs/*", "node_modules/*", "nodes/icons/*"]),

    // JSON files
    {
        files: ["**/*.json"],
        plugins: { json },
        language: "json/json",
        extends: ["json/recommended"],
    },

    // JavaScript files
    {
        files: ["**/*.js"],

        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "commonjs",
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.mocha,
                ...globals.jquery,
                RED: true,
            },
        },

        rules: {
            ...js.configs.recommended.rules,

            "prefer-destructuring": "off",
            "no-plusplus": "off",
            "no-global-require": "off",
            "no-prototype-builtins": "off",
            "no-multiple-empty-lines": "off",
            "no-trailing-spaces": "error",

            "max-len": [2, {
                code: 140,
                ignoreUrls: true,
            }],
        },
    },

    // HTML files. Node-RED node editor definitions are HTML fragments (a set of
    // <script> blocks), not full documents, so document-level rules are disabled.
    {
        files: ["**/*.html"],
        plugins: { html },
        extends: ["html/recommended"],
        language: "html/html",

        rules: {
            "html/require-doctype": "off",
            "html/require-title": "off",
            "html/require-lang": "off",
            "html/no-multiple-h1": "off",
            "html/use-baseline": "off",
            "html/indent": "off",
            "html/attrs-newline": "off",
            "html/element-newline": "off",
        },
    },
]);
