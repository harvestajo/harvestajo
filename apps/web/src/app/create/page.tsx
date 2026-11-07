"use client";

import { CreateFieldWizard } from "@/components/CreateFieldWizard";

export default function CreateFieldPage() {
  return (
    <div className="space-y-2">
      <div className="text-center mb-8 pt-4">
        <h1 className="text-2xl font-bold text-field-700 mb-2">
          {"\u{1F331}"} Plant a New Field
        </h1>
        <p className="text-sm text-soil-500 max-w-md mx-auto">
          Create a savings circle. Set the contribution size, member count, and
          cycle duration. You\u2019ll be the organizer.
        </p>
      </div>
      <CreateFieldWizard />
    </div>
  );
}
