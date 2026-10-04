// The nine weapons, as set up in modfairy.bas LoadLevel.

export enum WeaponType {
  Snipe = 0, // single pixel-accurate shot
  Blaster = 1, // blast radius with knockback
  SnipeRapid = 2, // Snipe, fires while the button is held
  BlasterRapid = 3, // Blaster, fires while the button is held
  Bus = 4,
  Mine = 5,
  Ion = 6,
  Piano = 7,
  Hole = 8,
}

export interface WeaponDef {
  num: number; // 1-9, matches number keys and scenario "weaponN" ammo
  name: string;
  type: WeaponType;
  icon: string;
  sound?: string;
  delay: number; // ms between shots
  power: number;
  blast?: number; // radius for Blaster types
}

export const WEAPONS: WeaponDef[] = [
  { num: 1, name: 'Pistol', type: WeaponType.Snipe, icon: 'gun', sound: '44mag', delay: 10, power: 1 },
  { num: 2, name: 'Shotgun', type: WeaponType.Blaster, icon: 'shotgun', sound: 'gun2', delay: 1500, power: 3, blast: 70 },
  { num: 3, name: 'Machine Gun', type: WeaponType.SnipeRapid, icon: 'mgun', sound: 'mgun', delay: 10, power: 2 },
  { num: 4, name: 'Howitzer', type: WeaponType.BlasterRapid, icon: 'howitz', sound: 'howie', delay: 100, power: 3, blast: 100 },
  { num: 5, name: 'Fairy Mines', type: WeaponType.Mine, icon: 'fmine1', delay: 0, power: 5 },
  { num: 6, name: 'Death Bus', type: WeaponType.Bus, icon: 'buscon', sound: 'mgun', delay: 2000, power: 10 },
  { num: 7, name: "Ion o' Death", type: WeaponType.Ion, icon: 'ioncon', delay: 3000, power: 99 },
  { num: 8, name: 'Piano Man', type: WeaponType.Piano, icon: 'pianocon', delay: 1, power: 25 },
  { num: 9, name: 'Black Hole', type: WeaponType.Hole, icon: 'holewep', delay: 1, power: 1 },
];

export const PISTOL = 1; // infinite ammo: Shot() never decrements weapon 1

export function isRapid(w: WeaponDef): boolean {
  return w.type === WeaponType.SnipeRapid || w.type === WeaponType.BlasterRapid;
}

export function isBlast(w: WeaponDef): boolean {
  return w.type === WeaponType.Blaster || w.type === WeaponType.BlasterRapid;
}

// Special weapons arrive in Phase 3. Until then they can't be selected.
export function isImplemented(w: WeaponDef): boolean {
  return w.type <= WeaponType.BlasterRapid;
}

// Ammo crates dropped by fairies with gift=N (Spawngift / CheckGiftHit).
export const GIFTS: Record<number, { sprite: string; weapon: number; ammo: number }> = {
  1: { sprite: 'shotammo', weapon: 2, ammo: 8 },
  2: { sprite: 'mgun', weapon: 3, ammo: 100 },
  3: { sprite: 'howieammo', weapon: 4, ammo: 25 },
  4: { sprite: 'mineammo', weapon: 5, ammo: 2 },
  5: { sprite: 'busammo', weapon: 6, ammo: 1 },
};
