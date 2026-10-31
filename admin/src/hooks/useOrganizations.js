import { useState, useEffect, useCallback } from "react";
import { adminApi } from "../api/client";

export function useOrganizations() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.fetchOrganizations();
      setOrganizations(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleStatus = async (orgId, currentStatus) => {
    const nextStatus = !currentStatus;

    // Optimistic state mutation
    setOrganizations((prev) =>
      prev.map((org) =>
        org._id === orgId
          ? {
              ...org,
              subscription: { ...org.subscription, isActive: nextStatus },
            }
          : org,
      ),
    );

    try {
      await adminApi.toggleSubscription(orgId, nextStatus);
    } catch (err) {
      // Rollback on network failure
      setOrganizations((prev) =>
        prev.map((org) =>
          org._id === orgId
            ? {
                ...org,
                subscription: { ...org.subscription, isActive: currentStatus },
              }
            : org,
        ),
      );
      throw err;
    }
  };

  const addOrganization = (newOrg) => {
    setOrganizations((prev) => [newOrg, ...prev]);
  };

  const updateOrgInState = (updatedOrg) => {
    setOrganizations((prev) =>
      prev.map((item) => (item._id === updatedOrg._id ? updatedOrg : item)),
    );
  };

  return {
    organizations,
    loading,
    error,
    reload: loadData,
    toggleStatus,
    addOrganization,
    updateOrgInState,
  };
}
