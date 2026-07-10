import { useMe } from "./useAuth";

export const useAbility = () => {
  const { data: me } = useMe();

  const can = (action: string, subject: string, fieldValues?: Record<string, any>): boolean => {
    if (!me || !me.permissions) return false;

    // ADMIN role (or any role possessing 'manage:all') gets full permissions
    const hasManageAll = me.permissions.some(
      (p) => p.action === "manage" && p.subject === "all"
    );
    if (hasManageAll) return true;

    // Check user specific permissions
    return me.permissions.some((p) => {
      if (p.action !== action || p.subject !== subject) return false;
      if (!p.conditions || !fieldValues) return true; // No conditions OR no verification data provided -> allow generic access

      return Object.entries(p.conditions).every(([key, value]) => {
        const userValue = fieldValues[key];

        // Support MongoDB/CASL $in operator
        if (value && typeof value === "object" && "$in" in value) {
          const inArray = (value as { $in: any[] }).$in;
          return Array.isArray(inArray) && inArray.includes(userValue);
        }

        // Direct value matching
        return userValue === value;
      });
    });
  };

  return { can };
};
