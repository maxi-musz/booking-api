import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsDDMMYYYYDate(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isDDMMYYYYDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          const regex = /^\d{2}-\d{2}-\d{4}$/;
          if (!regex.test(value)) return false;
          const [day, month, year] = value.split('-').map(Number);
          const date = new Date(year, month - 1, day);
          return (
            date.getDate() === day &&
            date.getMonth() === month - 1 &&
            date.getFullYear() === year
          );
        },
        defaultMessage(_args: ValidationArguments) {
          return '$property must be in DD-MM-YYYY format (e.g., 01-01-2024)';
        },
      },
    });
  };
}
