import { createZodDto } from "nestjs-zod";
import {
  // CREATE
  CreateContactBodySchema, CreateContactResSchema,
  // UPDATE
  UpdateContactBodySchema, UpdateContactResSchema,
  // GET ONE
  GetContactResSchema,
  // GET ALL
  GetContactsQuerySchema, GetContactsResSchema,
  GetContactsWithDealsActivitiesResSchema,
  // BULK IMPORT
  BulkImportContactsBodySchema,
} from "./contacts.model";

// CREATE
export class CreateContactBodyDto extends createZodDto(CreateContactBodySchema) {}
export class CreateContactResDto  extends createZodDto(CreateContactResSchema) {}

// UPDATE
export class UpdateContactBodyDto extends createZodDto(UpdateContactBodySchema) {}
export class UpdateContactResDto  extends createZodDto(UpdateContactResSchema) {}

// GET ONE
export class GetContactResDto extends createZodDto(GetContactResSchema) {}

// GET ALL
export class GetContactsQueryDto extends createZodDto(GetContactsQuerySchema) {}
export class GetContactsResDto   extends createZodDto(GetContactsWithDealsActivitiesResSchema) {}

// BULK IMPORT
export class BulkImportContactsBodyDto extends createZodDto(BulkImportContactsBodySchema) {}