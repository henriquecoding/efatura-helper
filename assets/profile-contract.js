/* Fatura Boa - contrato unico do perfil local entre as paginas do site.
 *
 * tool.js continua autocontido porque corre noutro dominio. Sempre que a chave ou o esquema mudar,
 * este ficheiro, tool.js e o motor inline de perfil.html devem mudar no mesmo commit. Nas paginas
 * do site, este e o unico lugar autorizado a interpretar validade e expiracao do perfil.
 */
(function (root) {
  "use strict";

  var KEY = "fb-profile-v1";
  var EXTRA_KEY = "fb-profile-extra";

  function parse(raw) {
    if (!raw) return null;
    try {
      var value = JSON.parse(raw);
      return value && typeof value === "object" ? value : null;
    } catch (e) { return null; }
  }

  function isExpired(profile, now) {
    if (!profile || !profile.expiresAt) return false;
    return Number(profile.expiresAt) <= (now == null ? Date.now() : now);
  }

  function read(storage, now) {
    storage = storage || root.localStorage;
    var profile;
    try { profile = parse(storage.getItem(KEY)); }
    catch (e) { return null; }
    if (!profile) return null;
    if (isExpired(profile, now)) {
      try { storage.removeItem(KEY); } catch (e) {}
      return null;
    }
    if (!profile.partitions || typeof profile.partitions !== "object") return null;
    return profile;
  }

  function completedPartitions(profile) {
    if (!profile || !profile.partitions) return [];
    return Object.keys(profile.partitions).filter(function (key) {
      var partition = profile.partitions[key];
      return partition && partition.status === "done" && partition.data;
    });
  }

  function clear(storage) {
    storage = storage || root.localStorage;
    try {
      storage.removeItem(KEY);
      storage.removeItem(EXTRA_KEY);
      return true;
    } catch (e) { return false; }
  }

  root.FBProfileContract = Object.freeze({
    KEY: KEY,
    EXTRA_KEY: EXTRA_KEY,
    parse: parse,
    isExpired: isExpired,
    read: read,
    completedPartitions: completedPartitions,
    clear: clear
  });
})(window);
