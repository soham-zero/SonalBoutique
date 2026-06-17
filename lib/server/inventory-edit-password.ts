import 'server-only'

/**
 * Password required for protected inventory edits (name, current_quantity corrections).
 * This file is server-only — importing it from a 'use client' module will cause a build error.
 */
export const INVENTORY_EDIT_PASSWORD = 'Sonal@2026'
