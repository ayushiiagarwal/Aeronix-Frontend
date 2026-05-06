import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'titlecase', standalone: true })
export class TitlecasePipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}
