/**
 * ENIGMA 2026 - Central Administrator Credentials and Role Configuration
 * 
 * Department Admins: Restrict access solely to their designated department.
 * Master Admins & Super Users: Full cross-department authority across all operations.
 */

export const ADMIN_ACCOUNTS = {
  // 1. Decor Department
  vexora17: {
    username: 'vexora17',
    name: 'Shrishti Pandey',
    password: 'Q7m!R2x#L9vP',
    adminKey: 'VexoraQn',
    department: 'decor',
    role: 'dept_admin',
    departmentName: 'Decor',
  },

  // 2. Technical Department
  nexil42: {
    username: 'nexil42',
    name: 'Harshit Pandey',
    password: 'T4z@K8p!W3rM',
    adminKey: 'NexilRav',
    department: 'technical',
    role: 'dept_admin',
    departmentName: 'Technical',
  },

  // 3. Design Department
  orvex63: {
    username: 'orvex63',
    name: 'Khushal Gupta',
    password: 'H9q#V4n!X7sK',
    adminKey: 'Orvexian',
    department: 'design',
    role: 'dept_admin',
    departmentName: 'Design',
  },

  // 4. Media Department
  kaelix28: {
    username: 'kaelix28',
    name: 'Shikhar Singh',
    password: 'P6w!Z2r@N8kT',
    adminKey: 'Kaelvorn',
    department: 'media',
    role: 'dept_admin',
    departmentName: 'Media',
  },

  // 5. Activity / Events Department
  zyrith51: {
    username: 'zyrith51',
    name: 'Prashansa',
    password: 'M8x@Q5t#R3vL',
    adminKey: 'Zyrithen',
    department: 'activity',
    role: 'dept_admin',
    departmentName: 'Activity',
  },

  // 6. Anchoring Department
  velcor74: {
    username: 'velcor74',
    name: 'Yash',
    password: 'K3n!T9q#W6pX',
    adminKey: 'Velcorix',
    department: 'anchoring',
    role: 'dept_admin',
    departmentName: 'Anchoring',
  },

  // 7. Flashmob Department
  aerwyn36: {
    username: 'aerwyn36',
    name: 'Shubhita',
    password: 'R7v#L2m!Q8zN',
    adminKey: 'AerwynKx',
    department: 'flashmob',
    role: 'dept_admin',
    departmentName: 'Flashmob',
  },

  // 8. Promotion Department
  quorin85: {
    username: 'quorin85',
    name: 'Aryan',
    password: 'X4p@M7k!V2rQ',
    adminKey: 'Quorinel',
    department: 'promotion',
    role: 'dept_admin',
    departmentName: 'Promotion',
  },

  // 9. Desk Duty Department
  sylven29: {
    username: 'sylven29',
    name: 'Jigyasha',
    password: 'N8q!W3x#K6tP',
    adminKey: 'SylvenRa',
    department: 'desk_duty',
    role: 'dept_admin',
    departmentName: 'Desk duty',
  },

  // 10. Master Admin 1
  dravex91: {
    username: 'dravex91',
    name: 'Master Admin 1',
    password: 'Z8r!Q4m#T7xLp',
    adminKey: 'NeonVexA',
    department: 'all',
    role: 'master_admin',
    departmentName: 'All Departments',
  },

  // 11. Super User
  shinjiikari: {
    username: 'shinjiikari',
    name: 'Super User',
    password: 'ayanamirei',
    adminKey: 'gendogay',
    department: 'all',
    role: 'super_admin',
    departmentName: 'All Departments',
  },

  // Legacy & Local Dev Fallbacks
  yash: {
    username: 'yash',
    name: 'Yash (Legacy Admin)',
    password: 'hailnerv',
    adminKey: 'NeonGene',
    department: 'all',
    role: 'master_admin',
    departmentName: 'All Departments',
  },
  shau: {
    username: 'shau',
    name: 'Shau (Legacy Admin)',
    password: 'hailnerv',
    adminKey: 'NeonGene',
    department: 'all',
    role: 'master_admin',
    departmentName: 'All Departments',
  },
  dev_admin: {
    username: 'dev_admin',
    name: 'Dev Admin',
    password: 'dev',
    adminKey: 'NeonGene',
    department: 'all',
    role: 'master_admin',
    departmentName: 'All Departments',
  }
};

/**
 * Finds an admin account record case-insensitively by username
 */
export function getAdminByUsername(username) {
  if (!username) return null;
  const key = String(username).trim().toLowerCase();
  return ADMIN_ACCOUNTS[key] || null;
}

/**
 * Verifies credentials against the accounts registry
 */
export function verifyCredentials(username, password, adminKey) {
  const account = getAdminByUsername(username);
  if (!account) return null;

  const passMatch = account.password === password;
  const keyMatch = account.adminKey === adminKey;

  if (passMatch && keyMatch) {
    return {
      username: account.username,
      name: account.name,
      department: account.department,
      role: account.role,
      departmentName: account.departmentName,
    };
  }
  return null;
}

/**
 * Checks whether an admin user has cross-department authority
 */
export function hasMasterAuthority(adminUser) {
  if (!adminUser) return false;
  return adminUser.department === 'all' || adminUser.role === 'master_admin' || adminUser.role === 'super_admin';
}
