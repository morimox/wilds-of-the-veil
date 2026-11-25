// One survey for all three provinces. Fourteen drawing units make one road step (二里).
const step = 14;

const positions = {
  village: [237, 100], marsh: [201, 141], ridge: [225, 127], ford: [287, 85],
  hidden: [335, 122], pine_ridge: [292, 106], kiln_valley: [273, 133], herb_basin: [288, 181],
  black_mine: [238, 138], snow_pass: [267, 155], sky_terrace: [262, 139], reed_meadows: [163, 110],
  pale_shoal: [225, 211], fish_ladder: [323, 173], willow_post: [334, 251], gauge_tower: [137, 165],
  screen_slope: [304, 221], lantern_court: [304, 141], undertow_grotto: [203, 111], counter_bell: [263, 115],
  zhao_city: [591, 200], green_dyke: [639, 167], flood_market: [623, 267], measuring_hall: [647, 219],
  frog_pond: [672, 148], old_marker: [686, 187], zhao_hermit: [740, 194], ring_isles: [705, 123],
  scale_bog: [723, 159], crane_granary: [666, 294], zhao_pass: [845, 210], jade_mill: [764, 143],
  charcoal_ridge: [697, 235], sunken_lab: [756, 88], night_pit: [748, 232], glass_bank: [708, 274],
  fault_lake: [780, 183], rope_sands: [812, 284], burnt_weir: [794, 235], beacon_reefs: [761, 278],
  mingsha_city: [1135.3, 35.8], cinder_inn: [1132.5, 150.7], sand_bell_cloister: [1162.5, 98.1], silk_tent_road: [1169.1, 116.1],
  salt_ledger_barrows: [1171.1, 41.7], stillwell_mouth: [1251.2, 54.6], stillwell_vault: [1223, 34.9], cold_kiln: [1318.9, 66.1],
  chalk_hoof_trail: [1167.5, 74.1], chalk_archive: [1198.1, 48.1], dry_sound_bridge: [1283.9, 60.2], wind_slate: [1236.6, 90.5],
  hollow_silo: [1416.4, 80.3], glass_hail_sink: [1377.2, 82.4], hanging_vein: [1277.9, 89.7], camel_grass_dunes: [1240, 123.5],
  guest_mill: [1206, 105], kiln_roof_farm: [1197.5, 134.3], bone_dry_rill: [1161.5, 141.7], glass_rotunda: [1358, 117],
};

const fogBorder = [[432, 86], [441, 127], [429, 173], [446, 210], [454, 252], [445, 297], [453, 356]];
const sandBorder = [[929, 102], [940, 144], [932, 187], [953, 229], [940, 276], [950, 319], [951, 352]];

export const atlasGeography = {
  overview: [36, -54, 1434, 443], step,
  provinces: {
    wuliang: {
      frame: [112, 52, 365, 274], label: [236, 156],
      outline: [[38, 157], [87, 99], [119, 83], [136, 40], [196, 16], [249, 26], [307, 39], [354, 22], [398, 50],
        ...fogBorder, [376, 328], [311, 308], [235, 329], [179, 305], [115, 279], [72, 222]],
    },
    zhaoyuan: {
      frame: [412, 45, 576, 322], label: [692, 259],
      outline: [fogBorder[0], [501, 66], [563, 84], [613, 46], [677, 69], [744, 38], [809, 75], [867, 78],
        ...sandBorder, [876, 357], [795, 371], [743, 348], [672, 372], [589, 339], [522, 357], ...fogBorder.slice(1).reverse()],
    },
    mingsha: {
      frame: [912, -27, 540, 387], label: [1219, 131],
      outline: [sandBorder[0], [1015, 54], [1094, 13], [1140, 3], [1188, -38], [1259, -22], [1321, -36], [1385, -12], [1442, 16],
        [1463, 66], [1444, 118], [1458, 168], [1421, 205], [1357, 221], [1301, 259], [1249, 245], [1178, 285],
        [1104, 276], [1023, 327], ...sandBorder.slice(1).reverse()],
    },
  },
  terrain: {
    rivers: [
      'M113 202 Q171 180 221 211 T294 245 Q312 258 347 245 T426 260 Q491 253 536 263 T654 285 Q705 271 749 292 T867 299',
      'M200 194 Q221 178 231 160 T257 130 Q273 98 305 75 Q335 67 355 91 T442 112 Q503 109 536 156 T610 180 Q644 177 667 194 T718 197',
      'M710 89 Q720 123 745 135 T765 173 Q754 221 787 249 T826 276',
    ],
    ridges: [
      [140, 71, 26], [170, 63, 18], [225, 54, 24], [276, 64, 28], [307, 49, 17], [340, 56, 23],
      [235, 148, 20], [259, 157, 13], [279, 149, 18], [315, 153, 19], [354, 170, 24], [390, 136, 18],
      [802, 113, 17], [832, 119, 22], [862, 156, 24], [882, 187, 15], [881, 233, 28], [892, 281, 24],
      [1134, -8, 20], [1170, -20, 31], [1209, -3, 26], [1254, -12, 34], [1298, 6, 26], [1360, 4, 22],
      [1272, 120, 16], [1309, 113, 24], [1345, 129, 21], [1397, 126, 25], [1420, 104, 15],
    ],
    dunes: [
      'M1034 80 q31 -19 60 0 m-72 12 q26 -16 57 -1 m14 82 q40 -20 73 -3 m-61 15 q43 -19 84 -6',
      'M1214 154 q39 -16 76 1 m-79 14 q35 -11 70 3 m-44 19 q43 -22 84 -4 m-65 18 q36 -15 70 -5',
      'M1332 39 q43 -18 85 0 m-61 13 q35 -11 67 3 m-48 108 q33 -14 60 1',
    ],
  },
};

const roadBends = {
  'marsh|village': [[214, 118]],
  'ford|ridge': [[270, 103], [235, 113]],
  'ridge|screen_slope': [[240, 189], [277, 213]],
  'black_mine|herb_basin': [[252, 166]],
  'lantern_court|pine_ridge': [[298, 118]],
  'glass_hail_sink|hanging_vein': [[1338, 102]],
  'ford|zhao_city': [[344, 69], [404, 84], [440, 116], [498, 126], [551, 141]],
  'flood_market|willow_post': [[551, 290], [511, 351], [472, 344], [435, 292], [382, 262]],
  'mingsha_city|zhao_pass': [[1096, 43], [1019, 76], [947, 130], [909, 146], [879, 141]],
  'cinder_inn|rope_sands': [[1096, 160], [1043, 214], [994, 277], [952, 322], [912, 318], [879, 290]],
};

export function atlasLocation(id) {
  return positions[id];
}

export function atlasRoadPath(from, to) {
  const [a, b] = [from, to].sort();
  if (!positions[a] || !positions[b]) return null;
  const path = [positions[a], ...(roadBends[`${a}|${b}`] ?? []), positions[b]];
  return from === a ? path : path.reverse();
}

export function atlasRoadDistance(path, shortTrail = false) {
  const length = path.slice(1).reduce((sum, [x, y], index) => {
    const [lastX, lastY] = path[index];
    return sum + Math.hypot(x - lastX, y - lastY);
  }, 0);
  const precision = shortTrail ? 2 : 1;
  return Math.max(1, Math.round(length / step * precision) / precision);
}

export function atlasBorderRoad(path, province) {
  const polygon = atlasGeography.provinces[province].outline;
  for (let i = 1; i < path.length; i++) {
    const [x, y] = path[i - 1];
    const dx = path[i][0] - x;
    const dy = path[i][1] - y;
    const cuts = [];
    for (let j = 0; j < polygon.length; j++) {
      const [u, v] = polygon[j];
      const [nextU, nextV] = polygon[(j + 1) % polygon.length];
      const sx = nextU - u;
      const sy = nextV - v;
      const determinant = dx * sy - dy * sx;
      if (!determinant) continue;
      const alongRoad = ((u - x) * sy - (v - y) * sx) / determinant;
      const alongBorder = ((u - x) * dy - (v - y) * dx) / determinant;
      if (alongRoad > 0 && alongRoad <= 1 && alongBorder >= 0 && alongBorder <= 1) cuts.push(alongRoad);
    }
    if (cuts.length) {
      const hit = Math.min(...cuts);
      return [...path.slice(0, i), [x + dx * hit, y + dy * hit]];
    }
  }
  return path;
}
