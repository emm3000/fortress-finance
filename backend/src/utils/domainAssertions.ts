import { errorCatalog } from './errorCatalog';

export function assertExists<T>(
  entity: T | null | undefined,
  notFoundMessage: string,
): asserts entity is T {
  if (!entity) {
    throw errorCatalog.resource.notFound(notFoundMessage);
  }
}

export function assertOwnedByUser(
  ownerUserId: string,
  expectedUserId: string,
  forbiddenMessage: string,
): void {
  if (ownerUserId !== expectedUserId) {
    throw errorCatalog.resource.forbidden(forbiddenMessage);
  }
}

export function assertNotDeleted(
  deletedAt: Date | null | undefined,
  notFoundMessage: string,
): void {
  if (deletedAt) {
    throw errorCatalog.resource.notFound(notFoundMessage);
  }
}
