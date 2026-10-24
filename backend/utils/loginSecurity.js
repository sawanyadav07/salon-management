const MAX_FAILED_ATTEMPTS = 5;
const getLockoutMinutes = () => {
  const configuredMinutes = Number(process.env.LOGIN_LOCKOUT_MINUTES);
  return Number.isFinite(configuredMinutes) && configuredMinutes > 0 ? configuredMinutes : 15;
};

const isLocked = (account, now = new Date()) => {
  if (!account.lockedUntil) return false;
  if (new Date(account.lockedUntil) > now) return true;
  account.failedLoginAttempts = 0;
  account.lockedUntil = null;
  return false;
};

const recordFailedLogin = async (account, now = new Date()) => {
  // Increment in SQL so simultaneous failures cannot overwrite one another.
  const [updatedCount] = await account.constructor.increment('failedLoginAttempts', {
    by: 1,
    where: { id: account.id, lockedUntil: null }
  });
  if (!updatedCount) return account.lockedUntil;

  await account.reload({ attributes: ['id', 'failedLoginAttempts', 'lockedUntil'] });
  if (account.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
    account.lockedUntil = new Date(now.getTime() + getLockoutMinutes() * 60 * 1000);
    await account.save({ fields: ['lockedUntil'] });
  }
  return account.lockedUntil;
};

const clearFailedLogins = async (account) => {
  if (!account.failedLoginAttempts && !account.lockedUntil) return;
  account.failedLoginAttempts = 0;
  account.lockedUntil = null;
  await account.save({ fields: ['failedLoginAttempts', 'lockedUntil'] });
};

module.exports = { isLocked, recordFailedLogin, clearFailedLogins, MAX_FAILED_ATTEMPTS, getLockoutMinutes };
