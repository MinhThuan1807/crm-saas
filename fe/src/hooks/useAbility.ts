import { useMe } from "./useAuth";

export const useAbility = () => {
  const { data: me } = useMe();

  const can = (action: string, subject: string): boolean => {
    if (!me || !me.permissions) return false;

    // Vai trò ADMIN (hoặc bất cứ vai trò nào sở hữu quyền 'manage' trên 'all') sẽ được toàn quyền
    const hasManageAll = me.permissions.some(
      (p: any) => p.action === "manage" && p.subject === "all"
    );
    if (hasManageAll) return true;

    // Kiểm tra quyền cụ thể của người dùng
    return me.permissions.some(
      (p: any) => p.action === action && p.subject === subject
    );
  };

  return { can };
};
