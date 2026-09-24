import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ToastProvider } from "@/components/ui/toast";
import {
  EmployeeDetailsCard,
  DriverDetailsCard,
} from "@/components/profile/rider-details-cards";
import RiderProfilePage from "@/app/deliver/profile/page";
import { useRouter } from "next/navigation";
import { getMyEmployeeProfile } from "@/lib/actions/employee-profile";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/lib/actions/employee-profile", () => ({
  getMyEmployeeProfile: vi.fn(),
}));

describe("rider profile edit cards", () => {
  const refresh = vi.fn();
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ refresh });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("shows role and shift read-only — a rider cannot edit their own", () => {
    render(
      <ToastProvider>
        <EmployeeDetailsCard role="Delivery" shift="Night" />
      </ToastProvider>,
    );

    expect(screen.getByText("Delivery")).toBeInTheDocument();
    expect(screen.getByText("Night")).toBeInTheDocument();

    // No Edit control and no inputs: nothing to change, nothing to submit.
    expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/shift/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/role/i)).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("saves rider vehicle details through the rider profile API", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ message: "Driver details updated successfully" }),
    });

    render(
      <ToastProvider>
        <DriverDetailsCard vehicleMakeModel="Toyota Vios" vehiclePlateNumber="ABC 1234" />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    fireEvent.change(screen.getByLabelText(/vehicle make model/i), {
      target: { value: "Honda City" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/employee/profile/rider",
        expect.objectContaining({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vehicleMakeModel: "Honda City" }),
        }),
      );
    });
  });

  it("uses the employee profile form on the rider page so name and birth date persist to the employee table", async () => {
    const mockResult = {
      success: true,
      data: {
        firstName: "Liza",
        lastName: "Reyes",
        name: "Liza Reyes",
        email: "liza@yangs.com",
        phoneNumber: "09123456789",
        dateOfBirth: "1995-06-17",
        role: "RIDER",
        scheduleShift: "AM",
        profileImageUrl: null,
        passwordLastUpdated: null,
        isAccountDisabled: false,
        rider: {
          vehicleMakeModel: "Toyota Vios",
          vehiclePlateNumber: "ABC 1234",
          driverLicenseNumber: null,
          licenseExpiryDate: null,
        },
      },
    };

    (getMyEmployeeProfile as any).mockResolvedValue(mockResult);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ message: "Personal details saved." }),
    });

    const result = await RiderProfilePage();
    render(result);

    fireEvent.click(screen.getAllByRole("button", { name: /edit/i })[0]);
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: "Liza Angela" },
    });
    fireEvent.change(screen.getByLabelText(/date of birth/i), {
      target: { value: "1995-06-17" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: /save changes/i })[0]);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/employee/profile",
        expect.objectContaining({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firstName: "Liza Angela", lastName: "Reyes", dateOfBirth: "1995-06-17" }),
        }),
      );
    });
  });

  it("keeps Save disabled and shows the error as soon as a field is cleared", () => {
    render(
      <ToastProvider>
        <DriverDetailsCard vehicleMakeModel="Toyota Vios" vehiclePlateNumber="ABC 1234" />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    fireEvent.change(screen.getByLabelText(/vehicle plate number/i), {
      target: { value: "" },
    });

    expect(screen.getByText("Enter the plate number.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
