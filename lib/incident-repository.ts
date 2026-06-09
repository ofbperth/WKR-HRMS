import "server-only";
import {
  getIncidentForUser,
  getIncidentList,
  getIncidentCommentsForUser,
  getIncidentAuditsForUser,
  removeSensitiveIncidentIdentifiers,
  type IncidentAccessUser,
  type IncidentFilterParams,
} from "@/lib/incident-query";

export const incidentRepository = {
  async listForUser(user: IncidentAccessUser, params: IncidentFilterParams) {
    const result = await getIncidentList(user, params);
    return {
      data: result.data.map(removeSensitiveIncidentIdentifiers),
      meta: result.meta,
    };
  },
  async getForUser(id: string, user: IncidentAccessUser) {
    const incident = await getIncidentForUser(id, user);
    return incident ? removeSensitiveIncidentIdentifiers(incident) : null;
  },
  async commentsForUser(id: string, user: IncidentAccessUser, take = 10, cursor?: string) {
    return getIncidentCommentsForUser(id, user, take, cursor);
  },
  async auditsForUser(id: string, user: IncidentAccessUser, take = 10, cursor?: string) {
    return getIncidentAuditsForUser(id, user, take, cursor);
  },
};
