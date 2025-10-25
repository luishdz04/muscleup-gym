// src/types/google-maps.d.ts

declare global {
  namespace google {
    namespace maps {
      namespace places {
        class Autocomplete {
          constructor(
            inputField: HTMLInputElement,
            opts?: AutocompleteOptions
          );
          addListener(eventName: string, handler: Function): void;
          getPlace(): PlaceResult;
        }

        interface AutocompleteOptions {
          componentRestrictions?: { country: string | string[] };
          fields?: string[];
          types?: string[];
        }

        interface PlaceResult {
          formatted_address?: string;
          address_components?: AddressComponent[];
          geometry?: {
            location: LatLng;
          };
        }

        interface AddressComponent {
          long_name: string;
          short_name: string;
          types: string[];
        }
      }

      class LatLng {
        constructor(lat: number, lng: number);
        lat(): number;
        lng(): number;
      }
    }
  }

  interface Window {
    google: typeof google;
  }
}

export {};
