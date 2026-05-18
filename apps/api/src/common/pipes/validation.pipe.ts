import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ZodSchema, ZodError } from 'zod';

@Injectable()
export class CustomValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype, type }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // Handle Zod schemas
    if (value instanceof ZodSchema) {
      try {
        return value.parse(value);
      } catch (error) {
        if (error instanceof ZodError) {
          throw new BadRequestException({
            message: 'Validation failed',
            errors: error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          });
        }
        throw error;
      }
    }

    // Handle class-validator
    const object = plainToInstance(metatype, value);
    const errors = await validate(object, {
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });

    if (errors.length > 0) {
      const formattedErrors = this.formatErrors(errors);
      throw new BadRequestException({
        message: 'Validation failed',
        errors: formattedErrors,
      });
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private formatErrors(errors: ValidationError[]): any[] {
    return errors.reduce((acc: any[], error: ValidationError) => {
      if (error.constraints) {
        acc.push({
          field: error.property,
          errors: Object.values(error.constraints),
        });
      }
      if (error.children) {
        acc.push(...this.formatErrors(error.children));
      }
      return acc;
    }, []);
  }
}
