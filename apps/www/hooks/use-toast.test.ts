import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { reducer, toast } from "./use-toast";

describe("useToast", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	describe("reducer", () => {
		const initialState = { toasts: [] };

		it("should add a toast", () => {
			const toastData = {
				id: "1",
				title: "Test Toast",
				description: "Test description",
			};

			const action = {
				type: "ADD_TOAST" as const,
				toast: toastData,
			};

			const newState = reducer(initialState, action);

			expect(newState.toasts).toHaveLength(1);
			expect(newState.toasts[0]).toEqual(toastData);
		});

		it("should limit toasts to TOAST_LIMIT (1)", () => {
			const firstToast = { id: "1", title: "First Toast" };
			const secondToast = { id: "2", title: "Second Toast" };

			let state = reducer(initialState, {
				type: "ADD_TOAST",
				toast: firstToast,
			});

			state = reducer(state, {
				type: "ADD_TOAST",
				toast: secondToast,
			});

			expect(state.toasts).toHaveLength(1);
			expect(state.toasts[0]).toEqual(secondToast);
		});

		it("should update a toast", () => {
			const initialToast = { id: "1", title: "Original Title" };
			const state = reducer(initialState, {
				type: "ADD_TOAST",
				toast: initialToast,
			});

			const updatedState = reducer(state, {
				type: "UPDATE_TOAST",
				toast: { id: "1", title: "Updated Title" },
			});

			expect(updatedState.toasts[0].title).toBe("Updated Title");
			expect(updatedState.toasts[0].id).toBe("1");
		});

		it("should not update non-existent toast", () => {
			const initialToast = { id: "1", title: "Original Title" };
			const state = reducer(initialState, {
				type: "ADD_TOAST",
				toast: initialToast,
			});

			const updatedState = reducer(state, {
				type: "UPDATE_TOAST",
				toast: { id: "2", title: "Updated Title" },
			});

			expect(updatedState.toasts[0].title).toBe("Original Title");
		});

		it("should dismiss a specific toast", () => {
			const toast1 = { id: "1", title: "Toast 1", open: true };
			const toast2 = { id: "2", title: "Toast 2", open: true };

			const state = { toasts: [toast1, toast2] };

			const updatedState = reducer(state, {
				type: "DISMISS_TOAST",
				toastId: "1",
			});

			expect(updatedState.toasts[0].open).toBe(false);
			expect(updatedState.toasts[1].open).toBe(true);
		});

		it("should dismiss all toasts when no toastId provided", () => {
			const toast1 = { id: "1", title: "Toast 1", open: true };
			const toast2 = { id: "2", title: "Toast 2", open: true };

			const state = { toasts: [toast1, toast2] };

			const updatedState = reducer(state, {
				type: "DISMISS_TOAST",
			});

			expect(updatedState.toasts[0].open).toBe(false);
			expect(updatedState.toasts[1].open).toBe(false);
		});

		it("should remove a specific toast", () => {
			const toast1 = { id: "1", title: "Toast 1" };
			const toast2 = { id: "2", title: "Toast 2" };

			const state = { toasts: [toast1, toast2] };

			const updatedState = reducer(state, {
				type: "REMOVE_TOAST",
				toastId: "1",
			});

			expect(updatedState.toasts).toHaveLength(1);
			expect(updatedState.toasts[0].id).toBe("2");
		});

		it("should remove all toasts when no toastId provided", () => {
			const toast1 = { id: "1", title: "Toast 1" };
			const toast2 = { id: "2", title: "Toast 2" };

			const state = { toasts: [toast1, toast2] };

			const updatedState = reducer(state, {
				type: "REMOVE_TOAST",
			});

			expect(updatedState.toasts).toHaveLength(0);
		});
	});

	describe("toast function", () => {
		it("should create a toast with generated id", () => {
			const toastResult = toast({
				title: "Test Toast",
				description: "Test description",
			});

			expect(toastResult).toHaveProperty("id");
			expect(toastResult).toHaveProperty("dismiss");
			expect(toastResult).toHaveProperty("update");
			expect(typeof toastResult.id).toBe("string");
			expect(typeof toastResult.dismiss).toBe("function");
			expect(typeof toastResult.update).toBe("function");
		});

		it("should generate unique ids for multiple toasts", () => {
			const toast1 = toast({ title: "Toast 1" });
			const toast2 = toast({ title: "Toast 2" });

			expect(toast1.id).not.toBe(toast2.id);
		});

		it("should call dismiss function without errors", () => {
			const toastResult = toast({ title: "Test Toast" });

			expect(() => toastResult.dismiss()).not.toThrow();
		});

		it("should call update function without errors", () => {
			const toastResult = toast({ title: "Test Toast" });

			expect(() =>
				toastResult.update({
					id: toastResult.id,
					title: "Updated Toast",
				}),
			).not.toThrow();
		});
	});
});
